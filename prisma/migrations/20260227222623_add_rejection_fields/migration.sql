-- AlterTable
ALTER TABLE "Trader" ADD COLUMN     "missingDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rejectionReason" TEXT;
