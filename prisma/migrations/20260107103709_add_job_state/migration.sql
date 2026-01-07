-- CreateTable
CREATE TABLE "JobState" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "lastRunAt" DATETIME NOT NULL,
    "nextRunAt" DATETIME NOT NULL
);
