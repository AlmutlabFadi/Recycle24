/*
  Warnings:

  - You are about to drop the column `executedAt` on the `ControlAction` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AuctionType" AS ENUM ('PRIVATE', 'GOVERNMENT');

-- CreateEnum
CREATE TYPE "AuctionWorkflowStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'SCHEDULED', 'OPEN', 'UNDER_REVIEW', 'AWAITING_WINNER_CONFIRMATION', 'AWAITING_PAYMENT_PROOF', 'AWAITING_DELIVERY', 'AWAITING_INSPECTION', 'COMPLETED', 'DISPUTED', 'CANCELED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuctionParticipantWorkflowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AuctionDepositWorkflowStatus" AS ENUM ('NONE', 'PENDING', 'HELD', 'VERIFIED', 'EXEMPT', 'RELEASED', 'FORFEITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BidWorkflowStatus" AS ENUM ('ACTIVE', 'OUTBID', 'WINNING', 'FINALIZED', 'DISQUALIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuctionExtensionStage" AS ENUM ('NONE', 'FIRST', 'SECOND', 'THIRD', 'FINAL_CLOSED');

-- CreateEnum
CREATE TYPE "AuctionPenaltyType" AS ENUM ('DEPOSIT_FORFEITURE', 'ACCOUNT_FREEZE', 'TEMP_BAN', 'LEGAL_ESCALATION');

-- CreateEnum
CREATE TYPE "AuctionDisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ESCALATED');

-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "depositPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "effectiveEndsAt" TIMESTAMP(3),
ADD COLUMN     "extensionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extensionStage" "AuctionExtensionStage" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "finalClosedAt" TIMESTAMP(3),
ADD COLUMN     "govWaiverFileUrl" TEXT,
ADD COLUMN     "govWaiverRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFinallyClosed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastExtensionAt" TIMESTAMP(3),
ADD COLUMN     "originalEndsAt" TIMESTAMP(3),
ADD COLUMN     "requiresESign" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reservePrice" DOUBLE PRECISION,
ADD COLUMN     "type" "AuctionType" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "winningBidId" TEXT,
ADD COLUMN     "workflowStatus" "AuctionWorkflowStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "AuctionParticipant" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "depositHoldId" TEXT,
ADD COLUMN     "depositWorkflowStatus" "AuctionDepositWorkflowStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "workflowStatus" "AuctionParticipantWorkflowStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Bid" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "participantId" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "BidWorkflowStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "ControlAction" DROP COLUMN "executedAt";

-- CreateTable
CREATE TABLE "AuctionEventLog" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "actorId" TEXT,
    "eventType" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionEventLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionDispute" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "status" "AuctionDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionPenalty" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AuctionPenaltyType" NOT NULL,
    "amount" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AuctionPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionEventLog_auctionId_createdAt_idx" ON "AuctionEventLog"("auctionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuctionEventLog_eventType_createdAt_idx" ON "AuctionEventLog"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AuctionDispute_auctionId_status_idx" ON "AuctionDispute"("auctionId", "status");

-- CreateIndex
CREATE INDEX "AuctionPenalty_auctionId_userId_idx" ON "AuctionPenalty"("auctionId", "userId");

-- CreateIndex
CREATE INDEX "AuctionPenalty_userId_type_idx" ON "AuctionPenalty"("userId", "type");

-- CreateIndex
CREATE INDEX "Auction_type_workflowStatus_idx" ON "Auction"("type", "workflowStatus");

-- CreateIndex
CREATE INDEX "Auction_effectiveEndsAt_idx" ON "Auction"("effectiveEndsAt");

-- CreateIndex
CREATE INDEX "Auction_winnerId_idx" ON "Auction"("winnerId");

-- CreateIndex
CREATE INDEX "Auction_winningBidId_idx" ON "Auction"("winningBidId");

-- CreateIndex
CREATE INDEX "AuctionParticipant_workflowStatus_idx" ON "AuctionParticipant"("workflowStatus");

-- CreateIndex
CREATE INDEX "AuctionParticipant_depositWorkflowStatus_idx" ON "AuctionParticipant"("depositWorkflowStatus");

-- CreateIndex
CREATE INDEX "AuctionParticipant_depositHoldId_idx" ON "AuctionParticipant"("depositHoldId");

-- CreateIndex
CREATE INDEX "Bid_auctionId_amount_idx" ON "Bid"("auctionId", "amount");

-- CreateIndex
CREATE INDEX "Bid_bidderId_createdAt_idx" ON "Bid"("bidderId", "createdAt");

-- CreateIndex
CREATE INDEX "Bid_status_idx" ON "Bid"("status");

-- AddForeignKey
ALTER TABLE "AuctionEventLog" ADD CONSTRAINT "AuctionEventLog_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionDispute" ADD CONSTRAINT "AuctionDispute_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionPenalty" ADD CONSTRAINT "AuctionPenalty_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionPenalty" ADD CONSTRAINT "AuctionPenalty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
