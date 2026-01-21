import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

const router = express.Router();
router.use(authenticate);

router.get("/status", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
    select: {
      canPlayCar: true,
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

router.post("/reward", async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { coins } = req.body as { coins: number };

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (!user.canPlayCar) {
    return res.status(400).json({
      success: false,
      message: "You didn't play the game",
    });
  }

  if (coins > 1000) {
    return res.status(400).json({
      success: false,
      message: "Coin limit exceeded. You might be hacking",
    });
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      coins: { increment: coins },
    },
  });

  res.status(200).json({
    success: true,
    message: "User rewarder successfully",
  });
});

export default router;
