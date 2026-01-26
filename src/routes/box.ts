import express from "express";
import crypto from "crypto";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";
import { generateRewards } from "../lib/randomBoxRewards";
import { rewardEffects } from "../lib/boxRewardEffect";

const router = express.Router();
router.use(authenticate);

const BOX_PRICE = 10_000;
const TOTAL_BOXES = 12;
const MAX_OPENS = 3;

/* ============================
   BUY BOX
============================ */

router.post("/pay-with-coins", async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.coins < BOX_PRICE) {
    return res
      .status(400)
      .json({ success: false, message: "Not enough coins" });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      coins: { decrement: BOX_PRICE },
      canPlayBox: true,
    },
  });

  res.json({ success: true });
});

/* ============================
   START BOX SESSION
============================ */

router.post("/start", async (req, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.canPlayBox) {
    return res.status(400).json({ success: false, message: "Not allowed" });
  }

  const rewards = generateRewards(TOTAL_BOXES);

  const session = await prisma.boxSession.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      rewards,
    },
  });

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      boxes: TOTAL_BOXES,
      maxOpens: MAX_OPENS,
    },
  });
});

/* ============================
   OPEN ONE BOX
============================ */
router.post("/open", async (req, res) => {
  const { sessionId, index } = req.body;

  const session = await prisma.boxSession.findUnique({
    where: { id: sessionId },
  });

  if (
    !session ||
    session.claimed ||
    session.opened >= MAX_OPENS ||
    index < 0 ||
    index >= TOTAL_BOXES
  ) {
    return res.status(400).json({ success: false, message: "Invalid move" });
  }

  // Cast rewards to array
  const rewards = session.rewards as any[];

  // Check if already opened
  if (rewards[index].isOpened) {
    return res.status(400).json({ success: false, message: "Already opened" });
  }

  // 1. Mark this specific reward as opened inside the JSON
  rewards[index].isOpened = true;

  // 2. Save the updated JSON back to DB
  await prisma.boxSession.update({
    where: { id: sessionId },
    data: {
      opened: { increment: 1 },
      rewards: rewards, // Save the modified array
    },
  });

  res.json({
    success: true,
    data: { reward: rewards[index] },
  });
});

/* ============================
   CLAIM REWARDS
============================ */
router.post("/claim", async (req, res) => {
  const { sessionId } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      const session = await tx.boxSession.findUnique({
        where: { id: sessionId },
      });

      if (!session || session.claimed) {
        throw new Error("Invalid session");
      }

      const rewards = session.rewards as any[];

      // FIX: Filter only rewards that have the 'isOpened' flag
      // This ensures we claim exactly what the user saw/clicked
      const openedRewards = rewards.filter((r) => r.isOpened);

      for (const reward of openedRewards) {
        const effect = rewardEffects[reward.id];
        if (!effect) throw new Error("Invalid reward ID: " + reward.id);
        await effect(tx, session.userId);
      }

      await tx.boxSession.update({
        where: { id: sessionId },
        data: { claimed: true },
      });

      await tx.user.update({
        where: { id: session.userId },
        data: { canPlayBox: false },
      });
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Claim failed" });
  }
});

/* ============================
   STATUS
============================ */

router.get("/status", async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { canPlayBox: true, boxSession: true },
  });

  res.json({ success: true, data: { user } });
});

export default router;
