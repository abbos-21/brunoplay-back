import { Prisma } from "@prisma/client";

export type Tx = Prisma.TransactionClient;

export const rewardEffects: Record<
  number,
  (tx: Tx, userId: number) => Promise<void>
> = {
  1: (tx, userId) =>
    tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 500 } },
    }),

  2: (tx, userId) =>
    tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 1000 } },
    }),

  3: (tx, userId) =>
    tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 3000 } },
    }),

  4: (tx, userId) =>
    tx.user.update({
      where: { id: userId },
      data: { coins: { increment: 5000 } },
    }),

  5: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 13, comment: "From box" },
    }),

  6: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 21, comment: "From box" },
    }),

  7: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 34, comment: "From box" },
    }),

  8: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 50, comment: "From box" },
    }),

  9: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 60, comment: "From box" },
    }),

  10: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 70, comment: "From box" },
    }),

  11: (tx, userId) =>
    tx.stars.create({
      data: { userId, amount: 100, comment: "From box" },
    }),

  12: (tx, userId) =>
    tx.gifts.create({
      data: { userId, name: "Mystery Gift (Box)" },
    }),
};
