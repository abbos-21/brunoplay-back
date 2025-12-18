/*
  Warnings:

  - Added the required column `ip` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Withdrawal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amountCoins" REAL NOT NULL,
    "amountTon" REAL NOT NULL,
    "ip" TEXT NOT NULL,
    "targetAddress" TEXT NOT NULL,
    "txHash" TEXT,
    "errorMessage" TEXT,
    CONSTRAINT "Withdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Withdrawal" ("amountCoins", "amountTon", "createdAt", "errorMessage", "id", "status", "targetAddress", "txHash", "updatedAt", "userId") SELECT "amountCoins", "amountTon", "createdAt", "errorMessage", "id", "status", "targetAddress", "txHash", "updatedAt", "userId" FROM "Withdrawal";
DROP TABLE "Withdrawal";
ALTER TABLE "new_Withdrawal" RENAME TO "Withdrawal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
