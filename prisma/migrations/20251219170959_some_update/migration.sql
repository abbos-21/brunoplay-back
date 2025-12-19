/*
  Warnings:

  - You are about to drop the column `canSpin` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "languageCode" TEXT,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "totalCoins" REAL NOT NULL DEFAULT 0,
    "coins" REAL NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "miningRate" REAL NOT NULL DEFAULT 0.025,
    "referredById" INTEGER,
    "rewardedLevels" TEXT NOT NULL DEFAULT '[]',
    "referralEarnings" REAL NOT NULL DEFAULT 0,
    "lastMiningTick" DATETIME,
    "isMining" BOOLEAN NOT NULL DEFAULT false,
    "tempCoins" REAL NOT NULL DEFAULT 0,
    "vaultCapacity" REAL NOT NULL DEFAULT 5,
    "currentHealth" REAL NOT NULL DEFAULT 600,
    "maxHealth" REAL NOT NULL DEFAULT 600,
    "currentEnergy" REAL NOT NULL DEFAULT 300,
    "maxEnergy" REAL NOT NULL DEFAULT 300,
    "healthPerSecond" REAL NOT NULL DEFAULT 1,
    "energyPerSecond" REAL NOT NULL DEFAULT 1,
    "vaultLevel" INTEGER NOT NULL DEFAULT 1,
    "miningRateLevel" INTEGER NOT NULL DEFAULT 1,
    "energyLevel" INTEGER NOT NULL DEFAULT 1,
    "healthLevel" INTEGER NOT NULL DEFAULT 1,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastWheelSpin" DATETIME,
    "subscriptions" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("coins", "createdAt", "currentEnergy", "currentHealth", "energyLevel", "energyPerSecond", "firstName", "healthLevel", "healthPerSecond", "id", "isBlocked", "isBot", "isMining", "languageCode", "lastMiningTick", "lastName", "lastWheelSpin", "level", "maxEnergy", "maxHealth", "miningRate", "miningRateLevel", "referralEarnings", "referredById", "rewardedLevels", "subscriptions", "telegramId", "tempCoins", "totalCoins", "updatedAt", "username", "vaultCapacity", "vaultLevel") SELECT "coins", "createdAt", "currentEnergy", "currentHealth", "energyLevel", "energyPerSecond", "firstName", "healthLevel", "healthPerSecond", "id", "isBlocked", "isBot", "isMining", "languageCode", "lastMiningTick", "lastName", "lastWheelSpin", "level", "maxEnergy", "maxHealth", "miningRate", "miningRateLevel", "referralEarnings", "referredById", "rewardedLevels", "subscriptions", "telegramId", "tempCoins", "totalCoins", "updatedAt", "username", "vaultCapacity", "vaultLevel" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
