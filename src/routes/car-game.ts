import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

const router = express.Router();
router.use(authenticate);

// CONSTANTS for Security
const MAX_COINS_PER_SECOND = 8; // Calculated based on your spawn rate (5 coins / 0.6s gap)
const SECURITY_BUFFER_SECONDS = 2; // Allow for slight network lag

// 1. START GAME ENDPOINT
router.post("/start", async (req: Request, res: Response) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.canPlayCar) {
    return res
      .status(403)
      .json({ success: false, message: "No ticket found. Please pay first." });
  }

  // Transaction: Deduct ticket AND create session immediately
  const session = await prisma.$transaction(async (tx) => {
    // 1. Consume the ticket so they can't retry
    await tx.user.update({
      where: { id: userId },
      data: { canPlayCar: false },
    });

    // 2. Create tracking session
    return await tx.carGameSession.create({
      data: {
        userId: userId,
        status: "ACTIVE",
        startTime: new Date(),
      },
    });
  });

  res.status(200).json({
    success: true,
    data: { sessionId: session.id },
  });
});

// 2. CLAIM REWARD ENDPOINT
router.post("/claim", async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { sessionId, coins, score } = req.body;

  const session = await prisma.carGameSession.findUnique({
    where: { id: sessionId },
  });

  // Basic Validation
  if (!session || session.userId !== userId) {
    return res.status(404).json({ success: false, message: "Invalid session" });
  }

  if (session.status !== "ACTIVE") {
    return res
      .status(400)
      .json({ success: false, message: "Session already claimed" });
  }

  // --- SECURITY CHECK: TIME ANALYSIS ---
  const now = new Date();
  const durationInSeconds =
    (now.getTime() - session.startTime.getTime()) / 1000;

  // Calculate the theoretical maximum coins possible in this duration
  // If they claim 100 coins but only played for 2 seconds, it's a hack.
  const maxPossibleCoins =
    (durationInSeconds + SECURITY_BUFFER_SECONDS) * MAX_COINS_PER_SECOND;

  if (coins > maxPossibleCoins) {
    // Mark as failed/cheated
    await prisma.carGameSession.update({
      where: { id: sessionId },
      data: { status: "FLAGGED_CHEAT", endTime: now, coins, score },
    });

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isBlocked: true,
      },
    });
    return res
      .status(400)
      .json({ success: false, message: "Anomalous gameplay detected." });
  }

  // Success Transaction
  await prisma.$transaction([
    // 1. Update User Balance
    prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: coins } },
    }),
    // 2. Close Session
    prisma.carGameSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        endTime: now,
        coins: coins,
        score: score,
      },
    }),
  ]);

  res.status(200).json({ success: true, message: "Reward claimed" });
});

// STATUS ENDPOINT (Keep as is, largely)
router.get("/status", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { canPlayCar: true },
  });

  res.status(200).json({ success: true, data: { user } });
});

export default router;
