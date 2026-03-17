-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "governorate" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "contactPhone" TEXT,
    "contactWhatsapp" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "services" TEXT[] DEFAULT ARRAY['DEPOSIT', 'WITHDRAW']::TEXT[],
    "workingHours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dealer_governorate_idx" ON "Dealer"("governorate");

-- CreateIndex
CREATE INDEX "Dealer_region_idx" ON "Dealer"("region");

-- CreateIndex
CREATE INDEX "Dealer_isActive_idx" ON "Dealer"("isActive");
