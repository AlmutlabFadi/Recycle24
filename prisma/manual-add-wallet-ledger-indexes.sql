CREATE INDEX IF NOT EXISTS "LedgerHold_accountId_status_idx"
ON "LedgerHold"("accountId", "status");

CREATE INDEX IF NOT EXISTS "JournalLine_accountId_createdAt_idx"
ON "JournalLine"("accountId", "createdAt");
