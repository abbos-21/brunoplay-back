import express from "express";
import authRouter from "./auth";
import gameRouter from "./game";
import userRouter from "./user";
import rewardRouter from "./reward";
import upgradesRouter from "./upgrades";
import withdrawalsRouter from "./withdrawals";
import taskRouter from "./task";
import adminRouter from "./admin";
import leaderboardRouter from "./leaderboard";
import blockListRouter from "./block-list";
import starsRouter from "./stars";
import boxRouter from "./box";
import prisma from "../prisma";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/game", gameRouter);
router.use("/user", userRouter);
router.use("/reward", rewardRouter);
router.use("/upgrades", upgradesRouter);
router.use("/withdrawals", withdrawalsRouter);
router.use("/task", taskRouter);
router.use("/admin", adminRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/block-list", blockListRouter);
router.use("/stars", starsRouter);
router.use("/box", boxRouter);

router.get("/next-refill-update", async (req, res) => {
  const job = await prisma.jobState.findUnique({
    where: { name: "daily-refill-update" },
  });

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  const now = Date.now();
  const diffMs = job.nextRunAt.getTime() - now;

  res.status(200).json({
    success: true,
    data: {
      secondsLeft: Math.max(0, Math.floor(diffMs / 1000)),
      nextUpdateAt: job.nextRunAt,
    },
  });
});

export default router;
