-- CreateEnum
CREATE TYPE "AuctionDomain" AS ENUM ('PRIVATE_PLATFORM_TERMS', 'PRIVATE_CONTRACT', 'GOVERNMENT_TENDER_TERMS');

-- CreateEnum
CREATE TYPE "AuctionDirection" AS ENUM ('FORWARD', 'REVERSE');

-- CreateEnum
CREATE TYPE "AuctionPricingMode" AS ENUM ('TOTAL', 'PER_TON', 'PER_KG', 'PER_UNIT', 'SERVICE_TOTAL');

-- CreateEnum
CREATE TYPE "AuctionWinnerSelectionMode" AS ENUM ('ONE_WINNER', 'MULTIPLE_WINNERS');

-- CreateEnum
CREATE TYPE "AuctionLotStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AuctionDepositMode" AS ENUM ('NONE', 'FLAT_AUCTION', 'PERCENT_AUCTION', 'PER_LOT_FLAT', 'PER_LOT_PERCENT', 'HYBRID');

-- CreateEnum
CREATE TYPE "AuctionParticipantLotWorkflowStatus" AS ENUM ('PENDING', 'SELECTED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "auctionDirection" "AuctionDirection" NOT NULL DEFAULT 'FORWARD',
ADD COLUMN     "auctionDomain" "AuctionDomain" NOT NULL DEFAULT 'PRIVATE_PLATFORM_TERMS',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'SYP',
ADD COLUMN     "disputeWindowHours" INTEGER,
ADD COLUMN     "governingLaw" TEXT,
ADD COLUMN     "jurisdictionCountry" TEXT,
ADD COLUMN     "pricingModeV2" "AuctionPricingMode" NOT NULL DEFAULT 'TOTAL',
ADD COLUMN     "winnerSelectionMode" "AuctionWinnerSelectionMode" NOT NULL DEFAULT 'ONE_WINNER';

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "lotId" TEXT;

-- CreateTable
CREATE TABLE "AuctionLot" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "lotNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "qualityGrade" TEXT,
    "currency" TEXT NOT NULL,
    "pricingMode" "AuctionPricingMode" NOT NULL,
    "direction" "AuctionDirection" NOT NULL,
    "startingPrice" DOUBLE PRECISION NOT NULL,
    "minimumIncrement" DOUBLE PRECISION NOT NULL,
    "reservePrice" DOUBLE PRECISION,
    "buyNowPrice" DOUBLE PRECISION,
    "depositModeOverride" "AuctionDepositMode",
    "depositAmountOverride" DOUBLE PRECISION,
    "depositPercentOverride" DOUBLE PRECISION,
    "status" "AuctionLotStatus" NOT NULL DEFAULT 'DRAFT',
    "winnerId" TEXT,
    "winningBidId" TEXT,
    "finalPrice" DOUBLE PRECISION,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionParticipantLot" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositHoldId" TEXT,
    "depositWorkflowStatus" "AuctionDepositWorkflowStatus" NOT NULL DEFAULT 'NONE',
    "workflowStatus" "AuctionParticipantLotWorkflowStatus" NOT NULL DEFAULT 'PENDING',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionParticipantLot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionLot_auctionId_idx" ON "AuctionLot"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionLot_status_idx" ON "AuctionLot"("status");

-- CreateIndex
CREATE INDEX "AuctionLot_winnerId_idx" ON "AuctionLot"("winnerId");

-- CreateIndex
CREATE INDEX "AuctionLot_winningBidId_idx" ON "AuctionLot"("winningBidId");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionLot_auctionId_lotNumber_key" ON "AuctionLot"("auctionId", "lotNumber");

-- CreateIndex
CREATE INDEX "AuctionParticipantLot_auctionId_idx" ON "AuctionParticipantLot"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionParticipantLot_participantId_idx" ON "AuctionParticipantLot"("participantId");

-- CreateIndex
CREATE INDEX "AuctionParticipantLot_lotId_idx" ON "AuctionParticipantLot"("lotId");

-- CreateIndex
CREATE INDEX "AuctionParticipantLot_depositHoldId_idx" ON "AuctionParticipantLot"("depositHoldId");

-- CreateIndex
CREATE INDEX "AuctionParticipantLot_depositWorkflowStatus_idx" ON "AuctionParticipantLot"("depositWorkflowStatus");

-- CreateIndex
CREATE INDEX "AuctionParticipantLot_workflowStatus_idx" ON "AuctionParticipantLot"("workflowStatus");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionParticipantLot_participantId_lotId_key" ON "AuctionParticipantLot"("participantId", "lotId");

-- CreateIndex
CREATE INDEX "Bid_lotId_idx" ON "Bid"("lotId");

-- AddForeignKey
ALTER TABLE "AuctionLot" ADD CONSTRAINT "AuctionLot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipantLot" ADD CONSTRAINT "AuctionParticipantLot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipantLot" ADD CONSTRAINT "AuctionParticipantLot_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "AuctionParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipantLot" ADD CONSTRAINT "AuctionParticipantLot_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "AuctionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "AuctionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
