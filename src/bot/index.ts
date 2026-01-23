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
import { StarTransaction, TransactionPartnerUser } from "grammy/types";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in .env");
}

export const bot = new Bot(BOT_TOKEN);

type StarTx = {
  id: string;
  amount: number;
  incoming: boolean;
  date: number;
};

async function getAllStarTransactions(): Promise<StarTx[]> {
  const all: StarTx[] = [];
  let offset: string | undefined;

  while (true) {
    const res = await bot.api.raw.getStarTransactions({
      offset: offset as unknown as number,
      limit: 100,
    });

    if (res.transactions.length === 0) break;

    for (const tx of res.transactions) {
      all.push({
        id: tx.id,
        amount: tx.amount,
        date: tx.date,
        incoming: tx.source?.type === "user",
      });
    }

    offset = res.transactions[res.transactions.length - 1].id;
  }

  return all;
}

function calculateRunningBalance(transactions: StarTx[]) {
  let balance = 0;

  const sorted = [...transactions].sort((a, b) => a.date - b.date);

  return sorted.map((tx) => {
    balance += tx.incoming ? tx.amount : -tx.amount;

    return {
      date: new Date(tx.date * 1000),
      type: tx.incoming ? "IN" : "OUT",
      amount: tx.amount,
      balanceAfter: balance,
    };
  });
}

const ALLOWED_USERS = new Set<number>([123456789, 987654321]);

bot.command("stars_tx", async (ctx) => {
  if (!ctx.from || !ALLOWED_USERS.has(ctx.from.id)) {
    await ctx.reply("⛔ You are not allowed to view Stars balance.");
    return;
  }

  const txs = await getAllStarTransactions();
  const ledger = calculateRunningBalance(txs);

  let text = "⭐ Stars Ledger\n\n";

  for (const tx of ledger.slice(-10)) {
    text +=
      `${tx.type === "IN" ? "➕" : "➖"} ` +
      `${tx.amount} ⭐ | Balance: ${tx.balanceAfter}\n`;
  }

  const currentBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balanceAfter : 0;

  text += `\n💰 Current balance: ${currentBalance} ⭐`;

  await ctx.reply(text);
});

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
