import express, { Request, Response } from "express";
import prisma from "../prisma";
import { bot } from "../bot";

const router = express.Router();

router.post("/create-invoice", async (req: Request, res: Response) => {
  const invoiceLink = await bot.api.createInvoiceLink(
    "Play box", //title
    "Some description", //description
    "{}", //payload
    "", // For Telegram Stars payment this should be empty
    "XTR", //currency
    [{ amount: 1, label: "Diamond" }]
  );

  res.status(200).json({
    success: true,
    data: { invoiceLink },
  });
});

export default router;
