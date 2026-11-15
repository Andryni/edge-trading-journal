-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "initialCapital" REAL NOT NULL,
    "profitTarget" REAL NOT NULL,
    "drawdownMode" TEXT NOT NULL DEFAULT 'STATIC',
    "maxDrawdown" REAL NOT NULL,
    "dailyLossLimit" REAL NOT NULL,
    "consistencyLimit" REAL NOT NULL,
    "minTradingDays" INTEGER NOT NULL DEFAULT 5,
    "maxContracts" INTEGER NOT NULL DEFAULT 3,
    "highWaterMark" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "setupId" TEXT,
    "importBatchId" TEXT,
    "sourceKey" TEXT,
    "enteredAt" DATETIME NOT NULL,
    "exitedAt" DATETIME,
    "analysisTimezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "instrument" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "stop" REAL NOT NULL,
    "target" REAL NOT NULL,
    "exit" REAL,
    "quantity" REAL NOT NULL,
    "fees" REAL NOT NULL DEFAULT 0,
    "tickSize" REAL NOT NULL,
    "tickValue" REAL NOT NULL,
    "session" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "planScore" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "didWell" TEXT NOT NULL DEFAULT '',
    "didWrong" TEXT NOT NULL DEFAULT '',
    "lesson" TEXT NOT NULL DEFAULT '',
    "mfeR" REAL,
    "maeR" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trade_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trade_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "Setup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Trade_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entryRules" TEXT NOT NULL DEFAULT '',
    "invalidation" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Setup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    CONSTRAINT "TradeTag_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Confluence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Confluence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeConfluence" (
    "tradeId" TEXT NOT NULL,
    "confluenceId" TEXT NOT NULL,

    PRIMARY KEY ("tradeId", "confluenceId"),
    CONSTRAINT "TradeConfluence_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TradeConfluence_confluenceId_fkey" FOREIGN KEY ("confluenceId") REFERENCES "Confluence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Screenshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "localPath" TEXT NOT NULL,
    "annotationsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Screenshot_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentalState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "energy" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "sleepHours" REAL,
    CONSTRAINT "MentalState_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "checklistJson" TEXT NOT NULL,
    "keyLevels" TEXT NOT NULL,
    "allowedSetupsJson" TEXT NOT NULL,
    "maxTrades" INTEGER NOT NULL,
    "validatedAt" DATETIME,
    CONSTRAINT "SessionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "planScore" INTEGER NOT NULL,
    "bestTradeId" TEXT,
    "worstMistake" TEXT NOT NULL,
    "tomorrowAction" TEXT NOT NULL,
    CONSTRAINT "SessionReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "target" REAL NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LockRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "dailyLossLimit" REAL NOT NULL,
    "maxTrades" INTEGER NOT NULL,
    "maxConsecutiveLosses" INTEGER NOT NULL,
    "cutoffNy" TEXT NOT NULL,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 30,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "LockRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "columnMappingJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportBatch_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoachMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Trade_accountId_enteredAt_idx" ON "Trade"("accountId", "enteredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_accountId_sourceKey_key" ON "Trade"("accountId", "sourceKey");

-- CreateIndex
CREATE UNIQUE INDEX "Setup_userId_name_key" ON "Setup"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TradeTag_tradeId_label_key" ON "TradeTag"("tradeId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Confluence_userId_name_key" ON "Confluence"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MentalState_tradeId_phase_key" ON "MentalState"("tradeId", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPlan_userId_localDate_key" ON "SessionPlan"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "SessionReview_userId_localDate_key" ON "SessionReview"("userId", "localDate");
