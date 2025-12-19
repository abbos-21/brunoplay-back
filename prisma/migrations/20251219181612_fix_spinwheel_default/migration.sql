-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "referralRewards" JSONB NOT NULL,
    "spinWheelCooldownHours" REAL NOT NULL DEFAULT 0.05,
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
INSERT INTO "new_Settings" ("channels", "coinToTonRate", "energyPrice", "healthPrice", "id", "maximumCoinWithdrawal", "minimumCoinWithdrawal", "referralRewards", "rewardForSubscription", "spinWheelCooldownHours", "spinWheelProbabilities", "upgradables", "upgradablesMaxLevel", "upgradeCosts") SELECT "channels", "coinToTonRate", "energyPrice", "healthPrice", "id", "maximumCoinWithdrawal", "minimumCoinWithdrawal", "referralRewards", "rewardForSubscription", coalesce("spinWheelCooldownHours", 0.05) AS "spinWheelCooldownHours", "spinWheelProbabilities", "upgradables", "upgradablesMaxLevel", "upgradeCosts" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
