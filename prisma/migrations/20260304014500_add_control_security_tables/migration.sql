-- CreateTable
CREATE TABLE "ControlAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT,
    "actionType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "requestId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "payloadHash" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlNonce" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlNonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlRateLimit" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ControlAuditLog_actorUserId_idx" ON "ControlAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "ControlAuditLog_actionType_idx" ON "ControlAuditLog"("actionType");

-- CreateIndex
CREATE INDEX "ControlAuditLog_entityType_idx" ON "ControlAuditLog"("entityType");

-- CreateIndex
CREATE INDEX "ControlAuditLog_createdAt_idx" ON "ControlAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ControlNonce_actorUserId_idx" ON "ControlNonce"("actorUserId");

-- CreateIndex
CREATE INDEX "ControlNonce_expiresAt_idx" ON "ControlNonce"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ControlNonce_actorUserId_routeKey_nonce_key" ON "ControlNonce"("actorUserId", "routeKey", "nonce");

-- CreateIndex
CREATE UNIQUE INDEX "ControlRateLimit_actorUserId_routeKey_windowStart_key" ON "ControlRateLimit"("actorUserId", "routeKey", "windowStart");

-- CreateIndex
CREATE INDEX "ControlRateLimit_routeKey_idx" ON "ControlRateLimit"("routeKey");

-- CreateIndex
CREATE INDEX "ControlRateLimit_updatedAt_idx" ON "ControlRateLimit"("updatedAt");

-- CreateIndex
CREATE INDEX "ControlRateLimit_windowStart_idx" ON "ControlRateLimit"("windowStart");

-- AddForeignKey
ALTER TABLE "ControlAuditLog" ADD CONSTRAINT "ControlAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlNonce" ADD CONSTRAINT "ControlNonce_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlRateLimit" ADD CONSTRAINT "ControlRateLimit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Immutable audit log triggers
CREATE OR REPLACE FUNCTION forbid_control_audit_mutations()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ControlAuditLog is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forbid_control_audit_update ON "ControlAuditLog";
DROP TRIGGER IF EXISTS trg_forbid_control_audit_delete ON "ControlAuditLog";

CREATE TRIGGER trg_forbid_control_audit_update
BEFORE UPDATE ON "ControlAuditLog"
FOR EACH ROW EXECUTE FUNCTION forbid_control_audit_mutations();

CREATE TRIGGER trg_forbid_control_audit_delete
BEFORE DELETE ON "ControlAuditLog"
FOR EACH ROW EXECUTE FUNCTION forbid_control_audit_mutations();
