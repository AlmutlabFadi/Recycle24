/*
  Warnings:

  - The values [FLAT_AUCTION,PERCENT_AUCTION,PER_LOT_FLAT,PER_LOT_PERCENT,HYBRID] on the enum `AuctionDepositMode` will be removed. If these variants are still used in the database, this will fail.
  - The values [PRIVATE_PLATFORM_TERMS,PRIVATE_CONTRACT,GOVERNMENT_TENDER_TERMS] on the enum `AuctionDomain` will be removed. If these variants are still used in the database, this will fail.
  - The values [SETTLED] on the enum `AuctionLotStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING] on the enum `AuctionParticipantLotWorkflowStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [TOTAL,PER_TON,PER_KG,PER_UNIT,SERVICE_TOTAL] on the enum `AuctionPricingMode` will be removed. If these variants are still used in the database, this will fail.
  - The values [ONE_WINNER,MULTIPLE_WINNERS] on the enum `AuctionWinnerSelectionMode` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `depositPercentOverride` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `lotNumber` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `materialType` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `minimumIncrement` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `pricingMode` on the `AuctionLot` table. All the data in the column will be lost.
  - You are about to drop the column `qualityGrade` on the `AuctionLot` table. All the data in the column will be lost.
  - The `depositRequired` column on the `AuctionParticipantLot` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `category` to the `AuctionLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineNo` to the `AuctionLot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pricingUnit` to the `AuctionLot` table without a default value. This is not possible if the table is not empty.
  - Made the column `depositModeOverride` on table `AuctionLot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `depositAmountOverride` on table `AuctionLot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuctionDepositMode_new" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');
ALTER TABLE "AuctionLot" ALTER COLUMN "depositModeOverride" TYPE "AuctionDepositMode_new" USING (
  CASE
    WHEN "depositModeOverride" IN ('FLAT_AUCTION', 'PER_LOT_FLAT') THEN 'FIXED'
    WHEN "depositModeOverride" IN ('PERCENT_AUCTION', 'PER_LOT_PERCENT', 'HYBRID') THEN 'PERCENTAGE'
    WHEN "depositModeOverride" IS NULL THEN 'NONE'
    ELSE "depositModeOverride"::text
  END::"AuctionDepositMode_new"
);
ALTER TYPE "AuctionDepositMode" RENAME TO "AuctionDepositMode_old";
ALTER TYPE "AuctionDepositMode_new" RENAME TO "AuctionDepositMode";
DROP TYPE "AuctionDepositMode_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuctionDomain_new" AS ENUM ('ASSET_SALE', 'SERVICE_PROCUREMENT');
ALTER TABLE "Auction" ALTER COLUMN "auctionDomain" DROP DEFAULT;
ALTER TABLE "Auction" ALTER COLUMN "auctionDomain" TYPE "AuctionDomain_new" USING (
  CASE
    WHEN "auctionDomain" = 'GOVERNMENT_TENDER_TERMS' THEN 'SERVICE_PROCUREMENT'
    WHEN "auctionDomain" IN ('PRIVATE_PLATFORM_TERMS', 'PRIVATE_CONTRACT') THEN 'ASSET_SALE'
    ELSE "auctionDomain"::text
  END::"AuctionDomain_new"
);
ALTER TYPE "AuctionDomain" RENAME TO "AuctionDomain_old";
ALTER TYPE "AuctionDomain_new" RENAME TO "AuctionDomain";
DROP TYPE "AuctionDomain_old";
ALTER TABLE "Auction" ALTER COLUMN "auctionDomain" SET DEFAULT 'ASSET_SALE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuctionLotStatus_new" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'AWARDED', 'FAILED', 'CANCELLED');
ALTER TABLE "AuctionLot" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "AuctionLot" ALTER COLUMN "status" TYPE "AuctionLotStatus_new" USING (
  CASE
    WHEN "status" = 'SETTLED' THEN 'CLOSED'
    ELSE "status"::text
  END::"AuctionLotStatus_new"
);
ALTER TYPE "AuctionLotStatus" RENAME TO "AuctionLotStatus_old";
ALTER TYPE "AuctionLotStatus_new" RENAME TO "AuctionLotStatus";
DROP TYPE "AuctionLotStatus_old";
ALTER TABLE "AuctionLot" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuctionParticipantLotWorkflowStatus_new" AS ENUM ('SELECTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');
ALTER TABLE "AuctionParticipantLot" ALTER COLUMN "workflowStatus" DROP DEFAULT;
ALTER TABLE "AuctionParticipantLot" ALTER COLUMN "workflowStatus" TYPE "AuctionParticipantLotWorkflowStatus_new" USING (
  CASE
    WHEN "workflowStatus" = 'PENDING' THEN 'SELECTED'
    ELSE "workflowStatus"::text
  END::"AuctionParticipantLotWorkflowStatus_new"
);
ALTER TYPE "AuctionParticipantLotWorkflowStatus" RENAME TO "AuctionParticipantLotWorkflowStatus_old";
ALTER TYPE "AuctionParticipantLotWorkflowStatus_new" RENAME TO "AuctionParticipantLotWorkflowStatus";
DROP TYPE "AuctionParticipantLotWorkflowStatus_old";
ALTER TABLE "AuctionParticipantLot" ALTER COLUMN "workflowStatus" SET DEFAULT 'SELECTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuctionPricingMode_new" AS ENUM ('LOT_BASED', 'BUNDLE_BASED');
ALTER TABLE "Auction" ALTER COLUMN "pricingModeV2" DROP DEFAULT;
ALTER TABLE "Auction" ALTER COLUMN "pricingModeV2" TYPE "AuctionPricingMode_new" USING (
  CASE
    WHEN "pricingModeV2" IN ('TOTAL', 'SERVICE_TOTAL') THEN 'BUNDLE_BASED'
    WHEN "pricingModeV2" IN ('PER_TON', 'PER_KG', 'PER_UNIT') THEN 'LOT_BASED'
    ELSE "pricingModeV2"::text
  END::"AuctionPricingMode_new"
);
ALTER TABLE "AuctionLot" ALTER COLUMN "pricingMode" TYPE "AuctionPricingMode_new" USING (
  CASE
    WHEN "pricingMode" IN ('TOTAL', 'SERVICE_TOTAL') THEN 'BUNDLE_BASED'
    WHEN "pricingMode" IN ('PER_TON', 'PER_KG', 'PER_UNIT') THEN 'LOT_BASED'
    ELSE "pricingMode"::text
  END::"AuctionPricingMode_new"
);
ALTER TYPE "AuctionPricingMode" RENAME TO "AuctionPricingMode_old";
ALTER TYPE "AuctionPricingMode_new" RENAME TO "AuctionPricingMode";
DROP TYPE "AuctionPricingMode_old";
ALTER TABLE "Auction" ALTER COLUMN "pricingModeV2" SET DEFAULT 'LOT_BASED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuctionWinnerSelectionMode_new" AS ENUM ('PER_LOT', 'SINGLE_WINNER');
ALTER TABLE "Auction" ALTER COLUMN "winnerSelectionMode" DROP DEFAULT;
ALTER TABLE "Auction" ALTER COLUMN "winnerSelectionMode" TYPE "AuctionWinnerSelectionMode_new" USING (
  CASE
    WHEN "winnerSelectionMode" = 'ONE_WINNER' THEN 'SINGLE_WINNER'
    WHEN "winnerSelectionMode" = 'MULTIPLE_WINNERS' THEN 'PER_LOT'
    ELSE "winnerSelectionMode"::text
  END::"AuctionWinnerSelectionMode_new"
);
ALTER TYPE "AuctionWinnerSelectionMode" RENAME TO "AuctionWinnerSelectionMode_old";
ALTER TYPE "AuctionWinnerSelectionMode_new" RENAME TO "AuctionWinnerSelectionMode";
DROP TYPE "AuctionWinnerSelectionMode_old";
ALTER TABLE "Auction" ALTER COLUMN "winnerSelectionMode" SET DEFAULT 'PER_LOT';
COMMIT;

-- DropIndex
DROP INDEX "AuctionLot_auctionId_lotNumber_key";

-- AlterTable
ALTER TABLE "Auction" ALTER COLUMN "auctionDomain" SET DEFAULT 'ASSET_SALE',
ALTER COLUMN "pricingModeV2" SET DEFAULT 'LOT_BASED',
ALTER COLUMN "winnerSelectionMode" SET DEFAULT 'PER_LOT';

-- AlterTable
ALTER TABLE "AuctionLot" DROP COLUMN "depositPercentOverride",
DROP COLUMN "lotNumber",
DROP COLUMN "materialType",
DROP COLUMN "minimumIncrement",
DROP COLUMN "pricingMode",
DROP COLUMN "qualityGrade",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "currentBestBid" DOUBLE PRECISION,
ADD COLUMN     "lineNo" INTEGER NOT NULL,
ADD COLUMN     "pricingUnit" TEXT NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'SYP',
ALTER COLUMN "direction" SET DEFAULT 'FORWARD',
ALTER COLUMN "depositModeOverride" SET NOT NULL,
ALTER COLUMN "depositModeOverride" SET DEFAULT 'NONE',
ALTER COLUMN "depositAmountOverride" SET NOT NULL,
ALTER COLUMN "depositAmountOverride" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "AuctionParticipantLot" DROP COLUMN "depositRequired",
ADD COLUMN     "depositRequired" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "workflowStatus" SET DEFAULT 'SELECTED';
