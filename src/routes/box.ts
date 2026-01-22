import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";
import { generateRewards, rewardById, rewards } from "../lib/randomBoxRewards";
import { boxRewardEffects } from "../lib/boxRewardEffect";

const PLAY_BOX_PRICE = 10000;

const router = express.Router();
router.use(authenticate);

// helpers
const parseRewardIds = (value: string): number[] => {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

/**
 * PAY WITH COINS
 */
router.post("/pay-with-coins", async (req: Request, res: Response) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coins: true, canPlayBox: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.canPlayBox) {
    return res.status(400).json({
      success: false,
      message: "Box already paid",
    });
  }

  if (user.coins < PLAY_BOX_PRICE) {
    return res
      .status(400)
      .json({ success: false, message: "Not enough coins" });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      coins: { decrement: PLAY_BOX_PRICE },
      canPlayBox: true,
      boxRewardIds: "[]",
    },
  });

  return res.json({
    success: true,
    message: "You can play box now",
  });
});

/**
 * GENERATE REWARDS (ONCE)
 */
router.post("/get-rewards", async (req: Request, res: Response) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { canPlayBox: true, boxRewardIds: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!user.canPlayBox) {
    return res.status(400).json({
      success: false,
      message: "You cannot play the box game",
    });
  }

  const existingRewards = parseRewardIds(user.boxRewardIds);
  if (existingRewards.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Rewards already generated",
    });
  }

  const rewardList = generateRewards(rewards, 12);

  await prisma.user.update({
    where: { id: userId },
    data: {
      boxRewardIds: JSON.stringify(rewardList.map((r) => r.id)),
    },
  });

  return res.json({
    success: true,
    data: { rewardList },
  });
});

/**
 * STATUS
 */
router.get("/status", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { canPlayBox: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  return res.json({
    success: true,
    data: { user },
  });
});

/**
 * APPLY REWARDS
 */
router.post("/reward-user", async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { rewardIds } = req.body as { rewardIds: number[] };

  if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid rewardIds",
    });
  }

  if (rewardIds.length > 3) {
    return res.status(400).json({
      success: false,
      message: "You can only choose 3 rewards",
    });
  }

  if (new Set(rewardIds).size !== rewardIds.length) {
    return res.status(400).json({
      success: false,
      message: "Duplicate rewards not allowed",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { canPlayBox: true, boxRewardIds: true },
  });

  if (!user || !user.canPlayBox) {
    return res.status(400).json({
      success: false,
      message: "You didn't play the game",
    });
  }

  const allowedRewards = parseRewardIds(user.boxRewardIds);

  for (const id of rewardIds) {
    if (!allowedRewards.includes(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reward selection",
      });
    }
  }

  const validRewards = rewardIds
    .map((id) => rewardById.get(id))
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  try {
    await prisma.$transaction(async (tx) => {
      for (const reward of validRewards) {
        const effect = boxRewardEffects[reward.id];
        if (!effect) {
          throw new Error(`No effect for reward ${reward.id}`);
        }
        await effect(tx, userId);
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          canPlayBox: false,
          boxRewardIds: "[]",
        },
      });
    });

    return res.json({
      success: true,
      data: { rewards: validRewards },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Failed to apply rewards",
    });
  }
});

export default router;
