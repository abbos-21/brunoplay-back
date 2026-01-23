import { Bot, InlineKeyboard } from "grammy";
import { BOT_TOKEN, WEB_APP_URL } from "../config/env";
import prisma from "../prisma";
import { StarTransaction } from "grammy/types";

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing in .env");
}

export const bot = new Bot(BOT_TOKEN);

/* =======================
   TYPES
======================= */

type StarTx = {
  id: string;
  amount: number;
  incoming: boolean;
  date: number;
  partner: string;
};

/* =======================
   CONSTANTS
======================= */

const ALLOWED_USERS = new Set<number>([1031081189]);
const PAGE_SIZE = 10;

/* =======================
   HELPERS
======================= */

function getPartnerLabel(tx: StarTransaction): string {
  const src = tx.source;
  if (!src) return "Unknown";

  switch (src.type) {
    case "user":
      return src.user.username
        ? `@${src.user.username}`
        : `${src.user.first_name}${src.user.last_name ? " " + src.user.last_name : ""}`;

    case "chat":
      return src.chat.title ?? "Chat";

    case "affiliate_program":
      return "🤝 Affiliate Program";

    case "fragment":
      return "🧩 Fragment";

    case "telegram_ads":
      return "📢 Telegram Ads";

    case "telegram_api":
      return "⚙️ Telegram API";

    case "other":
      return "❓ Other";

    default:
      return "Unknown";
  }
}

/* =======================
   FETCH STAR TRANSACTIONS
======================= */

async function getAllStarTransactions(): Promise<StarTx[]> {
  const all: StarTx[] = [];
  let offset: string | undefined;
  let lastId: string | undefined;

  while (true) {
    const res = await bot.api.raw.getStarTransactions({
      offset: offset as any, // grammY typing workaround
      // limit: 100,
    });

    if (res.transactions.length === 0) break;

    for (const tx of res.transactions) {
      all.push({
        id: tx.id,
        amount: tx.amount,
        date: tx.date,
        incoming: tx.source?.type === "user",
        partner: getPartnerLabel(tx),
      });
    }

    const lastTx = res.transactions[res.transactions.length - 1];
    const newLastId = lastTx?.id;

    if (!newLastId || newLastId === lastId) break;

    lastId = newLastId;
    offset = newLastId;
  }

  return all;
}

/* =======================
   BALANCE CALCULATION
======================= */

function calculateRunningBalance(transactions: StarTx[]) {
  let balance = 0;

  const sorted = [...transactions].sort((a, b) => a.date - b.date);

  return sorted.map((tx) => {
    balance += tx.incoming ? tx.amount : -tx.amount;

    return {
      date: new Date(tx.date * 1000),
      type: tx.incoming ? "IN" : "OUT",
      amount: tx.amount,
      partner: tx.partner,
      balanceAfter: balance,
    };
  });
}

/* =======================
   RENDER LEDGER (SHARED)
======================= */

function formatDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

async function renderStarsLedger(ctx: any, page: number, edit = false) {
  const txs = await getAllStarTransactions();
  const ledger = calculateRunningBalance(txs);

  const totalPages = Math.max(1, Math.ceil(ledger.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const start = (safePage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = ledger.slice(start, end);

  let text = `⭐ Stars Ledger (Page ${safePage}/${totalPages})\n\n`;

  for (const tx of pageItems) {
    const dateTime = formatDateTime(tx.date);

    text +=
      `${tx.type === "IN" ? "➕" : "➖"} ${tx.amount} ⭐ | ${tx.partner}\n` +
      `🕒 ${dateTime}\n\n`;
  }

  const currentBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balanceAfter : 0;

  text += `💰 Current balance: ${currentBalance} ⭐`;

  const keyboard = new InlineKeyboard();

  if (safePage > 1) {
    keyboard.text("⬅️ Previous", `stars_tx:${safePage - 1}`);
  }

  if (safePage < totalPages) {
    keyboard.text("➡️ Next", `stars_tx:${safePage + 1}`);
  }

  if (edit) {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } else {
    await ctx.reply(text, { reply_markup: keyboard });
  }
}

/* =======================
   COMMANDS
======================= */

bot.command("stars_tx", async (ctx) => {
  if (!ctx.from || !ALLOWED_USERS.has(ctx.from.id)) {
    await ctx.reply("⛔ You are not allowed to view Stars balance.");
    return;
  }

  await renderStarsLedger(ctx, 1);
});

/* =======================
   CALLBACK PAGINATION
======================= */

bot.callbackQuery(/^stars_tx:(\d+)$/, async (ctx) => {
  if (!ctx.from || !ALLOWED_USERS.has(ctx.from.id)) {
    await ctx.answerCallbackQuery({ text: "Not allowed", show_alert: true });
    return;
  }

  const page = Number(ctx.match[1]);
  await ctx.answerCallbackQuery();
  await renderStarsLedger(ctx, page, true);
});

/* =======================
   OTHER COMMANDS
======================= */

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
  await ctx.reply(
    "Available commands:\n" +
      "/stars_tx — View Stars transactions with pagination buttons",
  );
});

/* =======================
   PAYMENTS
======================= */

bot.on("message:successful_payment", async (ctx) => {
  const payment = ctx.message.successful_payment;
  if (payment.currency !== "XTR") return;

  const payload = JSON.parse(payment.invoice_payload);
  const { userId, product } = payload;

  if (product === "play-box") {
    await prisma.user.update({
      where: { id: userId },
      data: { canPlayBox: true },
    });
    await ctx.reply("✅ Payment successful! You can play the box game now.");
  }

  if (product === "play-car") {
    await prisma.user.update({
      where: { id: userId },
      data: { canPlayCar: true },
    });
    await ctx.reply("✅ Payment successful! You can play the car game now.");
  }
});

bot.on("pre_checkout_query", async (ctx) => {
  await ctx.answerPreCheckoutQuery(true);
});
