import { Prisma } from "@prisma/client";

export type Tx = Prisma.TransactionClient;

export const rewardEffects: Record<
  number,
  (tx: Tx, userId: number) => Promise<void>
> = {
  // 500 Coins
  1: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 500 } },
    });
  },

  // 1000 Coins
  2: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 1000 } },
    });
  },

  // 3000 Coins
  3: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 3000 } },
    });
  },

  // 5000 Coins
  4: async (tx, userId) => {
    await tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 5000 } },
    });
  },

  // 13 Stars
  5: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 13,
        comment: "From box",
      },
    });
  },

  // 21 Stars
  6: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 21,
        comment: "From box",
      },
    });
  },

  // 34 Stars
  7: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 34,
        comment: "From box",
      },
    });
  },

  // 50 Stars
  8: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 50,
        comment: "From box",
      },
    });
  },

  // 60 Stars
  9: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 60,
        comment: "From box",
      },
    });
  },

  // 70 Stars
  10: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 70,
        comment: "From box",
      },
    });
  },

  // 100 Stars
  11: async (tx, userId) => {
    await tx.stars.create({
      data: {
        userId,
        amount: 100,
        comment: "From box",
      },
    });
  },

  // Gift
  12: async (tx, userId) => {
    await tx.gifts.create({
      data: {
        userId,
        name: "Some gift (from box)",
      },
    });
  },
};
