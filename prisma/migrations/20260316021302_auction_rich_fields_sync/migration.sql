-- AlterTable
ALTER TABLE "Auction" ADD COLUMN     "allowPreview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "buyNowPriceCurrency" TEXT NOT NULL DEFAULT 'SYP',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "organization" TEXT,
ADD COLUMN     "previewEndDate" TIMESTAMP(3),
ADD COLUMN     "previewEndTime" TEXT,
ADD COLUMN     "previewStartDate" TIMESTAMP(3),
ADD COLUMN     "previewStartTime" TEXT,
ADD COLUMN     "pricingMode" TEXT NOT NULL DEFAULT 'unified',
ADD COLUMN     "securityDepositCurrency" TEXT NOT NULL DEFAULT 'SYP',
ADD COLUMN     "securityDepositMethod" TEXT NOT NULL DEFAULT 'platform',
ADD COLUMN     "shipmentDurationDays" INTEGER,
ADD COLUMN     "startingBidCurrency" TEXT NOT NULL DEFAULT 'SYP',
ADD COLUMN     "startingBidUnit" TEXT NOT NULL DEFAULT 'total',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AuctionItem" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customType" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "isAccurate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionDocument" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuctionItem_auctionId_idx" ON "AuctionItem"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionDocument_auctionId_idx" ON "AuctionDocument"("auctionId");

-- AddForeignKey
ALTER TABLE "AuctionItem" ADD CONSTRAINT "AuctionItem_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionDocument" ADD CONSTRAINT "AuctionDocument_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
