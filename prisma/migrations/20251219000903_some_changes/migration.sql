/*
  Warnings:

  - You are about to drop the column `spinWheelCooldownHours` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `lastWheelSpin` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "referralRewards" JSONB NOT NULL,
    "spinWheelProbabilities" JSONB NOT NULL,
    "energyPrice" INTEGER NOT NULL,
    "healthPrice" INTEGER NOT NULL,
    "upgradables" JSONB NOT NULL,
    "upgradeCosts" JSONB NOT NULL,
    "upgradablesMaxLevel" INTEGER NOT NULL,
    "coinToTonRate" INTEGER NOT NULL,
    "minimumCoinWithdrawal" INTEGER NOT NULL,
    "maximumCoinWithdrawal" INTEGER NOT NULL,
    "channels" JSONB NOT NULL,
    "rewardForSubscription" INTEGER NOT NULL
);
INSERT INTO "new_Settings" ("channels", "coinToTonRate", "energyPrice", "healthPrice", "id", "maximumCoinWithdrawal", "minimumCoinWithdrawal", "referralRewards", "rewardForSubscription", "spinWheelProbabilities", "upgradables", "upgradablesMaxLevel", "upgradeCosts") SELECT "channels", "coinToTonRate", "energyPrice", "healthPrice", "id", "maximumCoinWithdrawal", "minimumCoinWithdrawal", "referralRewards", "rewardForSubscription", "spinWheelProbabilities", "upgradables", "upgradablesMaxLevel", "upgradeCosts" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
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
    "subscriptions" TEXT NOT NULL DEFAULT '[]',
    "canSpin" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("canSpin", "coins", "createdAt", "currentEnergy", "currentHealth", "energyLevel", "energyPerSecond", "firstName", "healthLevel", "healthPerSecond", "id", "isBlocked", "isBot", "isMining", "languageCode", "lastMiningTick", "lastName", "level", "maxEnergy", "maxHealth", "miningRate", "miningRateLevel", "referralEarnings", "referredById", "rewardedLevels", "subscriptions", "telegramId", "tempCoins", "totalCoins", "updatedAt", "username", "vaultCapacity", "vaultLevel") SELECT "canSpin", "coins", "createdAt", "currentEnergy", "currentHealth", "energyLevel", "energyPerSecond", "firstName", "healthLevel", "healthPerSecond", "id", "isBlocked", "isBot", "isMining", "languageCode", "lastMiningTick", "lastName", "level", "maxEnergy", "maxHealth", "miningRate", "miningRateLevel", "referralEarnings", "referredById", "rewardedLevels", "subscriptions", "telegramId", "tempCoins", "totalCoins", "updatedAt", "username", "vaultCapacity", "vaultLevel" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
