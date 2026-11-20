ALTER TABLE "Account" ADD COLUMN "market" TEXT;
ALTER TABLE "Account" RENAME COLUMN "maxContracts" TO "previousMaxContracts";
ALTER TABLE "Account" ADD COLUMN "maxContracts" REAL NOT NULL DEFAULT 3;
UPDATE "Account" SET "maxContracts" = "previousMaxContracts";
ALTER TABLE "Account" DROP COLUMN "previousMaxContracts";
