-- Patch C: auction bid idempotency
ALTER TABLE "Bid" ADD COLUMN "requestKey" TEXT;
CREATE UNIQUE INDEX "Bid_requestKey_key" ON "Bid"("requestKey");
