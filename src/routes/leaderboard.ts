import express, { Request, Response } from "express";
import prisma from "../prisma";

const router = express.Router();

router.get("/level/:level", async (req: Request, res: Response) => {
  const { level } = req.params;

  const users = await prisma.user.findMany({
    where: {
      level: Number(level),
    },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      totalCoins: true,
    },
    orderBy: {
      totalCoins: "desc",
    },
    take: 100,
  });

  return res.status(200).json({
    success: true,
    data: { users },
  });
});

function getTimeLeft(end: Date) {
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    expired: false,
  };
}

router.get("/season/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const season = await prisma.season.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!season) {
    return res.status(404).json({
      success: false,
      message: "Season not found",
    });
  }

  const timeLeft = getTimeLeft(season.end);

  return res.status(200).json({
    success: true,
    data: {
      season,
      timeLeft,
    },
  });
});

export default router;
