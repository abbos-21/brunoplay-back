import express, { Request, Response } from "express";
import { bot } from "../bot";
import { authenticate } from "../middleware/authenticate";

const router = express.Router();
router.use(authenticate);

router.post("/create-invoice", async (req: Request, res: Response) => {
  if (!req.user.id) {
    return res.status(400).json({
      success: false,
      message: "Not authorized",
    });
  }

  const payload = JSON.stringify({
    userId: req.user.id,
    product: "play-box",
  });

  const invoiceLink = await bot.api.createInvoiceLink(
    "Play box", //title
    "Play the box game", //description
    payload, //payload
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
