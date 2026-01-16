import { bot } from ".";
import { getSettings } from "../config/settings";
import prisma from "../prisma";
import PQueue from "p-queue";

/* ------------------------------------------------------------------ */
/*                         TELEGRAM RATE LIMIT                          */
/* ------------------------------------------------------------------ */

// Telegram-safe request queue (prevents 429)
const telegramQueue = new PQueue({
  interval: 1000, // 1 second
  intervalCap: 25, // max 25 requests per second
});

/* ------------------------------------------------------------------ */
/*                     BOT ADMIN CHECK (NO CACHE)                       */
/* ------------------------------------------------------------------ */

export async function checkIfBotIsAdmin(): Promise<boolean> {
  try {
    const botId = (await telegramQueue.add(() => bot.api.getMe())).id;
    const { CHANNELS } = await getSettings();

    for (const channel of CHANNELS) {
      const member = await telegramQueue.add(() =>
        bot.api.getChatMember(channel, botId)
      );

      if (!["administrator", "creator"].includes(member.status)) {
        console.error(`❌ Bot is not admin in channel ${channel}`);
        return false;
      }
    }

    return true;
  } catch (error: any) {
    console.error("❌ Bot admin check failed:", error.message);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*                  USER SUBSCRIPTION CACHE (ONLY HERE)                 */
/* ------------------------------------------------------------------ */

type SubscriptionCacheEntry = {
  value: boolean;
  expiresAt: number;
};

const subscriptionCache = new Map<string, SubscriptionCacheEntry>();
const SUBSCRIPTION_TTL = 2 * 60 * 1000; // 2 minutes

export async function checkIfUserIsSubscribed(
  telegramId: string,
  channelUsername: string
): Promise<boolean> {
  const cacheKey = `${telegramId}:${channelUsername}`;
  const cached = subscriptionCache.get(cacheKey);

  // Return cached result if valid
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const isBotAdmin = await checkIfBotIsAdmin();
  if (!isBotAdmin) return false;

  try {
    const member = await telegramQueue.add(() =>
      bot.api.getChatMember(channelUsername, Number(telegramId))
    );

    const isSubscribed = ["member", "administrator", "creator"].includes(
      member.status
    );

    subscriptionCache.set(cacheKey, {
      value: isSubscribed,
      expiresAt: Date.now() + SUBSCRIPTION_TTL,
    });

    return isSubscribed;
  } catch (error: any) {
    console.warn(
      `⚠️ Failed to check subscription for user ${telegramId} in ${channelUsername}:`,
      error.message
    );
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*                       BROADCAST MESSAGES                              */
/* ------------------------------------------------------------------ */

export async function sendMessageToAllBotUsers(message: string) {
  const users = await prisma.user.findMany({
    select: { telegramId: true },
  });

  for (const user of users) {
    const targetId = Number(user.telegramId);

    try {
      await telegramQueue.add(() => bot.api.sendMessage(targetId, message));
    } catch (error: any) {
      console.warn(`⚠️ Failed to send to ${targetId}:`, error.message);
    }
  }

  console.log("✅ --- Broadcast Complete ---");
}
