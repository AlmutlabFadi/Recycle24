-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "slug" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "idempotencyKey" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerHold" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "referenceType" TEXT,
    "referenceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerHold_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_slug_key" ON "LedgerAccount"("slug");

-- CreateIndex
CREATE INDEX "LedgerAccount_ownerId_idx" ON "LedgerAccount"("ownerId");

-- CreateIndex
CREATE INDEX "LedgerAccount_slug_idx" ON "LedgerAccount"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_idempotencyKey_key" ON "JournalEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "JournalEntry_type_idx" ON "JournalEntry"("type");

-- CreateIndex
CREATE INDEX "JournalEntry_postedAt_idx" ON "JournalEntry"("postedAt");

-- CreateIndex
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE INDEX "JournalLine_createdAt_idx" ON "JournalLine"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerHold_accountId_idx" ON "LedgerHold"("accountId");

-- CreateIndex
CREATE INDEX "LedgerHold_status_idx" ON "LedgerHold"("status");

-- CreateIndex
CREATE INDEX "LedgerHold_referenceId_idx" ON "LedgerHold"("referenceId");

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerHold" ADD CONSTRAINT "LedgerHold_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Immutability Triggers
CREATE OR REPLACE FUNCTION block_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries are immutable and cannot be updated or deleted. entry_id: %', OLD.id;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entry_immutable
BEFORE UPDATE OR DELETE ON "JournalEntry"
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

CREATE TRIGGER trg_journal_line_immutable
BEFORE UPDATE OR DELETE ON "JournalLine"
FOR EACH ROW EXECUTE FUNCTION block_ledger_mutation();

-- Balance Verification Function
-- We use a function that can be called to verify an entry is balanced (Credits = Debits)
CREATE OR REPLACE FUNCTION verify_journal_entry_balance(entry_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    total_amount DOUBLE PRECISION;
BEGIN
    SELECT SUM(amount) INTO total_amount
    FROM "JournalLine"
    WHERE "entryId" = entry_id_param;
    
    IF total_amount != 0 THEN
        RAISE EXCEPTION 'Journal entry % is not balanced. Sum: %', entry_id_param, total_amount;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Audit Log for Ledger Critical Events
CREATE OR REPLACE FUNCTION log_ledger_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO "SecurityLog" (id, level, event, details, "createdAt")
    VALUES (
        'audit_' || gen_random_uuid(),
        'AUDIT',
        'LEDGER_POST',
        'Entry posted: ' || NEW.id || ' type: ' || NEW.type,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entry_audit
AFTER INSERT ON "JournalEntry"
FOR EACH ROW EXECUTE FUNCTION log_ledger_audit();
