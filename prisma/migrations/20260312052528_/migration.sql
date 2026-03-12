/*
  Warnings:

  - You are about to drop the `ControlAuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ControlNonce` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ControlRateLimit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ControlAuditLog" DROP CONSTRAINT "ControlAuditLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "ControlNonce" DROP CONSTRAINT "ControlNonce_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "ControlRateLimit" DROP CONSTRAINT "ControlRateLimit_actorUserId_fkey";

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "LedgerAccount" ADD COLUMN     "debtDueAt" TIMESTAMP(3),
ADD COLUMN     "debtLockReason" TEXT,
ADD COLUMN     "debtStatus" TEXT NOT NULL DEFAULT 'CLEAR',
ADD COLUMN     "lockedByDebt" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SupportTicket" ALTER COLUMN "category" SET DEFAULT 'عام';

-- AlterTable
ALTER TABLE "Trader" ADD COLUMN     "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- DropTable
DROP TABLE "ControlAuditLog";

-- DropTable
DROP TABLE "ControlNonce";

-- DropTable
DROP TABLE "ControlRateLimit";

-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "requestNote" TEXT,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SYP',
    "method" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestNote" TEXT,
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayoutRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountWaiverPolicy" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "waiveCommissions" BOOLEAN NOT NULL DEFAULT false,
    "waiveAuctionDeposits" BOOLEAN NOT NULL DEFAULT false,
    "waiveServiceFees" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountWaiverPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "dealId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemComponent" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "criticality" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "lastHeartbeatAt" TIMESTAMP(3),
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlEvent" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceComponentKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "tenantCountry" TEXT,
    "actorUserId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "traceId" TEXT,
    "ip" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ControlEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CtAlert" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "ruleKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "primaryEntityType" TEXT,
    "primaryEntityId" TEXT,
    "relatedEntities" JSONB NOT NULL DEFAULT '[]',
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "assignedToUserId" TEXT,
    "acknowledgedByUserId" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "CtAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'open',
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "ownerUserId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLink" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlAction" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedByUserId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "scope" JSONB NOT NULL DEFAULT '{}',
    "incidentId" TEXT,
    "result" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KillSwitch" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "state" TEXT NOT NULL DEFAULT 'off',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "KillSwitch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepositRequest_accountId_idx" ON "DepositRequest"("accountId");

-- CreateIndex
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");

-- CreateIndex
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");

-- CreateIndex
CREATE INDEX "DepositRequest_createdAt_idx" ON "DepositRequest"("createdAt");

-- CreateIndex
CREATE INDEX "PayoutRequest_accountId_idx" ON "PayoutRequest"("accountId");

-- CreateIndex
CREATE INDEX "PayoutRequest_userId_idx" ON "PayoutRequest"("userId");

-- CreateIndex
CREATE INDEX "PayoutRequest_status_idx" ON "PayoutRequest"("status");

-- CreateIndex
CREATE INDEX "PayoutRequest_createdAt_idx" ON "PayoutRequest"("createdAt");

-- CreateIndex
CREATE INDEX "AccountWaiverPolicy_accountId_idx" ON "AccountWaiverPolicy"("accountId");

-- CreateIndex
CREATE INDEX "AccountWaiverPolicy_isActive_idx" ON "AccountWaiverPolicy"("isActive");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "SystemComponent_key_key" ON "SystemComponent"("key");

-- CreateIndex
CREATE INDEX "SystemComponent_status_idx" ON "SystemComponent"("status");

-- CreateIndex
CREATE INDEX "SystemComponent_criticality_idx" ON "SystemComponent"("criticality");

-- CreateIndex
CREATE INDEX "ControlEvent_ts_idx" ON "ControlEvent"("ts" DESC);

-- CreateIndex
CREATE INDEX "ControlEvent_eventType_ts_idx" ON "ControlEvent"("eventType", "ts" DESC);

-- CreateIndex
CREATE INDEX "ControlEvent_entityType_entityId_idx" ON "ControlEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ControlEvent_sourceComponentKey_idx" ON "ControlEvent"("sourceComponentKey");

-- CreateIndex
CREATE INDEX "ControlEvent_severity_idx" ON "ControlEvent"("severity");

-- CreateIndex
CREATE INDEX "CtAlert_status_severity_createdAt_idx" ON "CtAlert"("status", "severity", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CtAlert_ruleKey_createdAt_idx" ON "CtAlert"("ruleKey", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CtAlert_assignedToUserId_idx" ON "CtAlert"("assignedToUserId");

-- CreateIndex
CREATE INDEX "Incident_status_severity_idx" ON "Incident"("status", "severity");

-- CreateIndex
CREATE INDEX "Incident_ownerUserId_idx" ON "Incident"("ownerUserId");

-- CreateIndex
CREATE INDEX "IncidentLink_linkType_linkId_idx" ON "IncidentLink"("linkType", "linkId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentLink_incidentId_linkType_linkId_key" ON "IncidentLink"("incidentId", "linkType", "linkId");

-- CreateIndex
CREATE INDEX "ControlAction_status_createdAt_idx" ON "ControlAction"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ControlAction_type_idx" ON "ControlAction"("type");

-- CreateIndex
CREATE INDEX "ControlAction_requestedByUserId_idx" ON "ControlAction"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ControlAction_incidentId_idx" ON "ControlAction"("incidentId");

-- CreateIndex
CREATE UNIQUE INDEX "KillSwitch_key_key" ON "KillSwitch"("key");

-- CreateIndex
CREATE INDEX "KillSwitch_state_idx" ON "KillSwitch"("state");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_createdAt_idx" ON "JournalLine"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerAccount_status_idx" ON "LedgerAccount"("status");

-- CreateIndex
CREATE INDEX "LedgerAccount_debtStatus_idx" ON "LedgerAccount"("debtStatus");

-- CreateIndex
CREATE INDEX "LedgerAccount_lockedByDebt_idx" ON "LedgerAccount"("lockedByDebt");

-- CreateIndex
CREATE INDEX "LedgerHold_accountId_status_idx" ON "LedgerHold"("accountId", "status");

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositRequest" ADD CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutRequest" ADD CONSTRAINT "PayoutRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountWaiverPolicy" ADD CONSTRAINT "AccountWaiverPolicy_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLink" ADD CONSTRAINT "IncidentLink_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
