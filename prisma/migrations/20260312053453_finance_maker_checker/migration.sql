-- AlterTable
ALTER TABLE "DepositRequest" ADD COLUMN     "approvalStage" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN     "approvalStage" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT;
