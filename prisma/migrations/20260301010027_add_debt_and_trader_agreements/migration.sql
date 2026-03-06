-- AlterTable
ALTER TABLE "AuctionParticipant" ADD COLUMN     "agreedToCommission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreedToDataSharing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreedToPrivacy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "agreedToTerms" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LedgerAccount" ADD COLUMN     "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "debtStartedAt" TIMESTAMP(3);
