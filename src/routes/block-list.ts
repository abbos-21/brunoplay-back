import express, { Request, Response } from "express";
import prisma from "../prisma";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  const users = prisma.user.findMany({
    where: {
      isBlocked: true,
    },
    select: {
      telegramId: true,
    },
  });

  return res.status(200).json({
    success: true,
    data: { users },
  });
});

export default router;
