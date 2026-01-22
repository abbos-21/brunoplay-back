-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stars" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "comment" TEXT,
    "amount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stars_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stars" ("amount", "comment", "createdAt", "id", "updatedAt", "userId") SELECT "amount", "comment", "createdAt", "id", "updatedAt", "userId" FROM "Stars";
DROP TABLE "Stars";
ALTER TABLE "new_Stars" RENAME TO "Stars";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
