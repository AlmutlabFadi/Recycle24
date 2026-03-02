-- AlterTable
ALTER TABLE "Trader" ADD COLUMN     "chamberMembershipYear" INTEGER,
ADD COLUMN     "chamberRegistrationNumber" TEXT,
ADD COLUMN     "chamberSerialNumber" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "governorate" TEXT,
ADD COLUMN     "issueDate" TIMESTAMP(3),
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "taxNumber" TEXT;
