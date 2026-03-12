-- CreateIndex
CREATE INDEX IF NOT EXISTS "TraderDocument_traderId_createdAt_idx"
ON "TraderDocument"("traderId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DriverDocument_driverId_createdAt_idx"
ON "DriverDocument"("driverId", "createdAt");