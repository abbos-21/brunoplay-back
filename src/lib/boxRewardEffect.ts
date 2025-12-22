import { Prisma } from "@prisma/client";

export type Tx = Prisma.TransactionClient;

export const rewardEffects: Record<
  number,
  (tx: Tx, userId: number) => Promise<void>
> = {
  // Energy refill
  1: async (tx, userId) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { maxEnergy: true },
    });

    if (!user) throw new Error("User not found");

    await tx.user.update({
      where: { id: userId },
      data: { currentEnergy: user.maxEnergy },
    });
  },

  // Health refill
  2: async (tx, userId) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { maxHealth: true },
    });

    if (!user) throw new Error("User not found");

    await tx.user.update({
      where: { id: userId },
      data: { currentHealth: user.maxHealth },
    });
  },

  // Coins
  3: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 3000 } },
    });
  },

  4: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 5000 } },
    });
  },

  5: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 7000 } },
    });
  },

  6: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 10000 } },
    });
  },

  7: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 20000 } },
    });
  },

  8: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 50000 } },
    });
  },

  9: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 75000 } },
    });
  },

  10: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 100000 } },
    });
  },

  // Stars
  11: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 100,
      },
    });
  },

  // Gift
  12: async (tx, userId) => {
    await tx.gifts.create({
      data: {
        userId,
        name: "Some gift",
      },
    });
  },
};
