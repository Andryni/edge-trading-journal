-- CreateTable
CREATE TABLE "AuthSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JournalDocument" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JournalDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
