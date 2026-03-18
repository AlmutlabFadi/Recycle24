-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "senderAccountId" TEXT,
    "receiverAccountId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "referenceNote" TEXT,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferRequest_senderId_idx" ON "TransferRequest"("senderId");

-- CreateIndex
CREATE INDEX "TransferRequest_receiverId_idx" ON "TransferRequest"("receiverId");

-- CreateIndex
CREATE INDEX "TransferRequest_status_idx" ON "TransferRequest"("status");

-- CreateIndex
CREATE INDEX "TransferRequest_createdAt_idx" ON "TransferRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "LedgerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferRequest" ADD CONSTRAINT "TransferRequest_receiverAccountId_fkey" FOREIGN KEY ("receiverAccountId") REFERENCES "LedgerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
