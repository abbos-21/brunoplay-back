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

import { Bot } from "grammy";
import { BOT_TOKEN, WEB_APP_URL } from "../config/env";
import prisma from "../prisma";

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
