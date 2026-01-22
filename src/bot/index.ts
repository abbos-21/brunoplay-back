// import { Telegraf } from "telegraf";
// import { BOT_TOKEN, WEB_APP_URL } from "../config/env";

// if (!BOT_TOKEN) {
//   throw new Error("BOT_TOKEN is missing in .env");
// }

// export const bot = new Telegraf(BOT_TOKEN);

// bot.start((ctx) => {
//   ctx.reply("👋 Welcome! Tap below to open the Mini App:", {
//     reply_markup: {
//       inline_keyboard: [
//         [
//           {
//             text: "🚀 Open Mini App",
//             web_app: { url: WEB_APP_URL },
//           },
//         ],
//       ],
//     },
//   });
// });

// bot.command("help", (ctx) => ctx.reply("This bot powers the Mini App!"));

import { Bot, Context } from "grammy";
import { BOT_TOKEN, WEB_APP_URL } from "../config/env";
import prisma from "../prisma";
import { StarTransactions, StarTransaction } from "grammy/types";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in .env");
}

export const bot = new Bot(BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply("👋 Welcome! Tap below to open the Mini App:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Open Mini App",
            web_app: { url: WEB_APP_URL },
          },
        ],
      ],
    },
  });
});

bot.command("help", async (ctx) => {
  await ctx.reply("This bot powers the Mini App!");
});

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;

  if (payment.currency !== "XTR") return;

  const payload = JSON.parse(payment.invoice_payload);

  const userId = payload.userId;
  const product = payload.product;

  if (product === "play-box") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        canPlayBox: true,
      },
    });

    await ctx.reply("✅ Payment successful! You can play the box game now.");
  } else if (product === "play-car") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        canPlayCar: true,
      },
    });

    await ctx.reply("✅ Payment successful! You can play the car game now.");
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});

const OWNER_ID = 1031081189; // Replace with the specific user's Telegram ID

// Command handler for /stars (only accessible to the owner)
bot.command("stars", async (ctx: Context) => {
  if (ctx.from?.id !== OWNER_ID) {
    return ctx.reply("Access denied. This command is only for the bot owner.");
  }

  try {
    // Fetch all transactions (paginated)
    let offset: number = 0; // Offset is a number for pagination
    const limit = 100; // Max per request
    const allTransactions: StarTransaction[] = [];
    let balanceWhole = 0;
    let balanceNano = 0;

    while (true) {
      const txResponse: StarTransactions = await ctx.api.getStarTransactions({
        offset,
        limit,
      });
      allTransactions.push(...txResponse.transactions);

      // Update balance
      for (const tx of txResponse.transactions) {
        const amountWhole = tx.amount ?? 0;
        const amountNano = tx.nanostar_amount ?? 0;
        if (tx.source) {
          // Incoming: add
          balanceWhole += amountWhole;
          balanceNano += amountNano;
        } else if (tx.receiver) {
          // Outgoing: subtract
          balanceWhole -= amountWhole;
          balanceNano -= amountNano;
        }
        // Handle nano overflow/underflow
        while (balanceNano >= 1_000_000_000) {
          balanceWhole += 1;
          balanceNano -= 1_000_000_000;
        }
        while (balanceNano < 0) {
          balanceWhole -= 1;
          balanceNano += 1_000_000_000;
        }
      }

      if (txResponse.transactions.length < limit) break;
      offset = parseInt(
        txResponse.transactions[txResponse.transactions.length - 1].id,
      );
    }

    // Compute final balance for display
    const balance = balanceWhole + balanceNano / 1_000_000_000;
    let responseText = `Current Stars Balance: ${balance} ⭐️\n\n`;

    // Append transaction details
    responseText += "All Transactions:\n";
    if (allTransactions.length === 0) {
      responseText += "No transactions found.";
    } else {
      allTransactions.forEach((tx, index) => {
        const txDate = new Date(tx.date * 1000).toISOString();
        responseText += `\nTransaction #${index + 1}:\n`;
        responseText += `- ID: ${tx.id}\n`;
        responseText += `- Date: ${txDate}\n`;
        const txAmount = (tx.source ? "+" : "-") + (tx.amount ?? 0);
        responseText += `- Amount: ${txAmount} ⭐️ (net transfer)\n`;
        if (tx.nanostar_amount)
          responseText += `- Nano Amount: ${(tx.source ? "+" : "-") + tx.nanostar_amount} (1/1e9 Stars)\n`;
        if (tx.source)
          responseText += `- Source: ${JSON.stringify(tx.source, null, 2)}\n`;
        if (tx.receiver)
          responseText += `- Receiver: ${JSON.stringify(tx.receiver, null, 2)}\n`;
      });
    }

    // Send the response (split if too long for Telegram message limits)
    await ctx.reply(responseText);
  } catch (error) {
    console.error(error);
    await ctx.reply(`Error fetching Stars info: ${(error as Error).message}`);
  }
});
