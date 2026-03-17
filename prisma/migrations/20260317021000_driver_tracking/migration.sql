-- AlterTable
ALTER TABLE "DriverSession" ADD COLUMN "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "DriverLocationLog" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverLocationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverLocationLog_driverId_idx" ON "DriverLocationLog"("driverId");

-- CreateIndex
CREATE INDEX "DriverLocationLog_recordedAt_idx" ON "DriverLocationLog"("recordedAt");

-- CreateIndex
CREATE INDEX "DriverLocationLog_driverId_recordedAt_idx" ON "DriverLocationLog"("driverId", "recordedAt");

-- AddForeignKey
ALTER TABLE "DriverLocationLog" ADD CONSTRAINT "DriverLocationLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
