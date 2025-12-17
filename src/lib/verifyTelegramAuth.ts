import { validate, parse } from "@tma.js/init-data-node";
import { BOT_TOKEN } from "../config/env";

export function verifyTelegramAuth(initData: string) {
  if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing in .env");
  }

  if (!initData || typeof initData !== "string") {
    return { valid: false };
  }

  try {
    validate(initData, BOT_TOKEN, {
      expiresIn: 86400,
    });

    const parsed = parse(initData);

    if (!parsed.user) {
      return { valid: false };
    }

    return {
      valid: true,
      user: parsed.user,
    };
  } catch (error) {
    if (error instanceof Error) {
      console.warn("Telegram initData validation failed:", error.message);
    } else {
      console.error("Unexpected error during Telegram validation:", error);
    }

    return { valid: false };
  }
}
