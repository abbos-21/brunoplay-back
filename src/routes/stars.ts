import express, { Request, Response } from "express";
import prisma from "../prisma";
import { bot } from "../bot";

const router = express.Router();

router.post("/create-invoice", async (req: Request, res: Response) => {});

export default router;
