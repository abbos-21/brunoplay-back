import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authenticate } from "../middleware/authenticate";

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

export default router;
