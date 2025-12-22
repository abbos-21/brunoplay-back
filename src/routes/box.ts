import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";
import { generateRewards, rewardById, rewards } from "../lib/randomBoxRewards";
import { rewardEffects } from "../lib/boxRewardEffect";

const PLAY_BOX_PRICE = 10000;

const router = express.Router();
router.use(authenticate);

router.post("/pay-with-coins", async (req: Request, res: Response) => {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.coins < PLAY_BOX_PRICE) {
    return res
      .status(400)
      .json({ success: false, message: "Not enough coins" });
  }

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      coins: { decrement: PLAY_BOX_PRICE },
      canPlayBox: true,
    },
  });

  res.status(200).json({
    success: true,
    message: "Operation successful. You can play box now",
  });
});

router.post("/get-rewards", async (req: Request, res: Response) => {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (!user.canPlayBox) {
    return res
      .status(400)
      .json({ success: false, message: "You cannot play the box game" });
  }

  const rewardList = generateRewards(rewards, 12);

  res.status(200).json({
    success: true,
    data: {
      rewardList,
    },
  });
});

router.get("/status", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      canPlayBox: true,
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: {
      user: user,
    },
  });
});

router.post("/reward-user", async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { rewardIds } = req.body as { rewardIds: number[] };

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.canPlayBox) {
    return res.status(400).json({
      success: false,
      message: "You didn't play the game",
    });
  }

  const validRewards = rewardIds
    .map((id) => rewardById.get(id))
    .filter(
      (reward): reward is NonNullable<typeof reward> => reward !== undefined
    );

  if (validRewards.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid rewards",
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      for (const reward of validRewards) {
        const effect = rewardEffects[reward.id];
        if (!effect) {
          throw new Error(`No effect for reward ${reward.id}`);
        }

        await effect(tx, userId);
      }

      // Prevent replay
      await tx.user.update({
        where: { id: userId },
        data: { canPlayBox: false },
      });
    });

    return res.json({
      success: true,
      data: {
        rewards: validRewards,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to apply rewards",
    });
  }
});

export default router;
