-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "titleId" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'unknown',
    "userType" TEXT NOT NULL DEFAULT 'TRADER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "role" TEXT NOT NULL DEFAULT 'TRADER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT,
    "companyName" TEXT,
    "companyType" TEXT,
    "companyTypeOther" TEXT,
    "businessType" TEXT,
    "businessTypeOther" TEXT,
    "jobTitle" TEXT,
    "jobTitleOther" TEXT,
    "bio" TEXT,
    "notifEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifSms" BOOLEAN NOT NULL DEFAULT false,
    "notifWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "notifTelegram" BOOLEAN NOT NULL DEFAULT false,
    "notifPush" BOOLEAN NOT NULL DEFAULT true,
    "notifDeals" BOOLEAN NOT NULL DEFAULT true,
    "notifAuctions" BOOLEAN NOT NULL DEFAULT true,
    "notifMarketing" BOOLEAN NOT NULL DEFAULT false,
    "smsPhone" TEXT,
    "whatsappPhone" TEXT,
    "telegramUsername" TEXT,
    "verificationCode" TEXT,
    "verificationExpiry" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorMethod" TEXT,
    "faceIdEnabled" BOOLEAN NOT NULL DEFAULT false,
    "showPhone" BOOLEAN NOT NULL DEFAULT false,
    "hideWarehouseLocation" BOOLEAN NOT NULL DEFAULT false,
    "allowFactoryContact" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device" TEXT,
    "deviceType" TEXT DEFAULT 'phone',
    "location" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trader" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "location" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderDocument" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "weightUnit" TEXT NOT NULL DEFAULT 'KG',
    "location" TEXT NOT NULL,
    "startingBid" DOUBLE PRECISION NOT NULL,
    "buyNowPrice" DOUBLE PRECISION,
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "finalPrice" DOUBLE PRECISION,
    "currentBid" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionParticipant" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "depositPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "entryFeePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isExempt" BOOLEAN NOT NULL DEFAULT false,
    "depositStatus" TEXT NOT NULL DEFAULT 'HELD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuctionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionImage" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "bidderId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceSYP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "dealId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metal" TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecyclePoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecyclePoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "details" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentTask" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payload" TEXT,
    "result" TEXT,
    "error" TEXT,
    "assignedToId" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "materialType" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupGovernorate" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryGovernorate" TEXT NOT NULL,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "transportType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimatedPrice" DOUBLE PRECISION NOT NULL,
    "actualPrice" DOUBLE PRECISION,
    "driverId" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "vehicleType" TEXT,
    "plateNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Ø¹Ø§Ù…',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT,
    "content" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReport" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "category" TEXT NOT NULL,
    "file" TEXT,
    "line" INTEGER,
    "message" TEXT NOT NULL,
    "suggestion" TEXT,
    "codeBefore" TEXT,
    "codeAfter" TEXT,
    "autoFixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsocc_incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "source_ip" TEXT,
    "user_id" TEXT,
    "incident_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gsocc_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsocc_evidence_logs" (
    "id" TEXT NOT NULL,
    "incident_id" TEXT NOT NULL,
    "action_taken" TEXT NOT NULL,
    "executed_by" TEXT NOT NULL,
    "evidence_snapshot" JSONB,
    "hash_signature" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gsocc_evidence_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gsocc_security_rules" (
    "id" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "target_value" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "reason" TEXT,
    "incident_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gsocc_security_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StolenReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reportingOrg" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "customItemType" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "plateNumber" TEXT,
    "vehicleType" TEXT,
    "vehicleColor" TEXT,
    "stolenDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StolenReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeItem" (
    "id" TEXT NOT NULL,
    "center" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT,
    "mediaUrl" TEXT,
    "coverImageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "authorName" TEXT,
    "sourceLabel" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncidentReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterRole" TEXT,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "immediateAction" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyIncidentReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyTrainingSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL DEFAULT 'BASIC',
    "location" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "instructorName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyTrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyTrainingRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "requesterName" TEXT,
    "requesterPhone" TEXT,
    "requesterRole" TEXT,
    "sessionId" TEXT,
    "requestedSessionTitle" TEXT,
    "preferredDate" TIMESTAMP(3),
    "participantsCount" INTEGER NOT NULL DEFAULT 1,
    "location" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SafetyTrainingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyChecklistSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "checklistName" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "responses" JSONB NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyChecklistSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "roleId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Trader_userId_key" ON "Trader"("userId");

-- CreateIndex
CREATE INDEX "Trader_verificationStatus_idx" ON "Trader"("verificationStatus");

-- CreateIndex
CREATE INDEX "TraderDocument_traderId_idx" ON "TraderDocument"("traderId");

-- CreateIndex
CREATE INDEX "TraderDocument_status_idx" ON "TraderDocument"("status");

-- CreateIndex
CREATE INDEX "Auction_sellerId_idx" ON "Auction"("sellerId");

-- CreateIndex
CREATE INDEX "Auction_category_idx" ON "Auction"("category");

-- CreateIndex
CREATE INDEX "Auction_status_idx" ON "Auction"("status");

-- CreateIndex
CREATE INDEX "Auction_endsAt_idx" ON "Auction"("endsAt");

-- CreateIndex
CREATE INDEX "AuctionParticipant_auctionId_idx" ON "AuctionParticipant"("auctionId");

-- CreateIndex
CREATE INDEX "AuctionParticipant_userId_idx" ON "AuctionParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuctionParticipant_auctionId_userId_key" ON "AuctionParticipant"("auctionId", "userId");

-- CreateIndex
CREATE INDEX "AuctionImage_auctionId_idx" ON "AuctionImage"("auctionId");

-- CreateIndex
CREATE INDEX "Bid_auctionId_createdAt_idx" ON "Bid"("auctionId", "createdAt");

-- CreateIndex
CREATE INDEX "Deal_sellerId_idx" ON "Deal"("sellerId");

-- CreateIndex
CREATE INDEX "Deal_buyerId_idx" ON "Deal"("buyerId");

-- CreateIndex
CREATE INDEX "Deal_status_idx" ON "Deal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Transaction_walletId_idx" ON "Transaction"("walletId");

-- CreateIndex
CREATE INDEX "Transaction_dealId_idx" ON "Transaction"("dealId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_idx" ON "PriceAlert"("userId");

-- CreateIndex
CREATE INDEX "PriceAlert_isActive_idx" ON "PriceAlert"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RecyclePoints_userId_key" ON "RecyclePoints"("userId");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE INDEX "SecurityLog_event_idx" ON "SecurityLog"("event");

-- CreateIndex
CREATE INDEX "SecurityLog_level_idx" ON "SecurityLog"("level");

-- CreateIndex
CREATE INDEX "SecurityLog_createdAt_idx" ON "SecurityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_name_key" ON "Agent"("name");

-- CreateIndex
CREATE INDEX "Agent_type_idx" ON "Agent"("type");

-- CreateIndex
CREATE INDEX "Agent_status_idx" ON "Agent"("status");

-- CreateIndex
CREATE INDEX "Agent_lastHeartbeat_idx" ON "Agent"("lastHeartbeat");

-- CreateIndex
CREATE INDEX "AgentTask_status_idx" ON "AgentTask"("status");

-- CreateIndex
CREATE INDEX "AgentTask_priority_idx" ON "AgentTask"("priority");

-- CreateIndex
CREATE INDEX "AgentTask_type_idx" ON "AgentTask"("type");

-- CreateIndex
CREATE INDEX "AgentTask_assignedToId_idx" ON "AgentTask"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportBooking_trackingId_key" ON "TransportBooking"("trackingId");

-- CreateIndex
CREATE INDEX "TransportBooking_userId_idx" ON "TransportBooking"("userId");

-- CreateIndex
CREATE INDEX "TransportBooking_trackingId_idx" ON "TransportBooking"("trackingId");

-- CreateIndex
CREATE INDEX "TransportBooking_status_idx" ON "TransportBooking"("status");

-- CreateIndex
CREATE INDEX "TransportBooking_driverId_idx" ON "TransportBooking"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketId_key" ON "SupportTicket"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketId_idx" ON "SupportTicket"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_idx" ON "SupportTicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_createdAt_idx" ON "SupportTicketMessage"("createdAt");

-- CreateIndex
CREATE INDEX "AgentReport_severity_idx" ON "AgentReport"("severity");

-- CreateIndex
CREATE INDEX "AgentReport_agentName_idx" ON "AgentReport"("agentName");

-- CreateIndex
CREATE INDEX "AgentReport_taskType_idx" ON "AgentReport"("taskType");

-- CreateIndex
CREATE INDEX "AgentReport_autoFixed_idx" ON "AgentReport"("autoFixed");

-- CreateIndex
CREATE INDEX "AgentReport_createdAt_idx" ON "AgentReport"("createdAt");

-- CreateIndex
CREATE INDEX "StolenReport_userId_idx" ON "StolenReport"("userId");

-- CreateIndex
CREATE INDEX "StolenReport_status_idx" ON "StolenReport"("status");

-- CreateIndex
CREATE INDEX "StolenReport_type_idx" ON "StolenReport"("type");

-- CreateIndex
CREATE INDEX "StolenReport_createdAt_idx" ON "StolenReport"("createdAt");

-- CreateIndex
CREATE INDEX "KnowledgeItem_center_idx" ON "KnowledgeItem"("center");

-- CreateIndex
CREATE INDEX "KnowledgeItem_type_idx" ON "KnowledgeItem"("type");

-- CreateIndex
CREATE INDEX "KnowledgeItem_status_idx" ON "KnowledgeItem"("status");

-- CreateIndex
CREATE INDEX "KnowledgeItem_priority_idx" ON "KnowledgeItem"("priority");

-- CreateIndex
CREATE INDEX "KnowledgeItem_createdAt_idx" ON "KnowledgeItem"("createdAt");

-- CreateIndex
CREATE INDEX "SafetyIncidentReport_userId_idx" ON "SafetyIncidentReport"("userId");

-- CreateIndex
CREATE INDEX "SafetyIncidentReport_status_idx" ON "SafetyIncidentReport"("status");

-- CreateIndex
CREATE INDEX "SafetyIncidentReport_severity_idx" ON "SafetyIncidentReport"("severity");

-- CreateIndex
CREATE INDEX "SafetyIncidentReport_createdAt_idx" ON "SafetyIncidentReport"("createdAt");

-- CreateIndex
CREATE INDEX "SafetyTrainingSession_status_idx" ON "SafetyTrainingSession"("status");

-- CreateIndex
CREATE INDEX "SafetyTrainingSession_startDate_idx" ON "SafetyTrainingSession"("startDate");

-- CreateIndex
CREATE INDEX "SafetyTrainingRequest_userId_idx" ON "SafetyTrainingRequest"("userId");

-- CreateIndex
CREATE INDEX "SafetyTrainingRequest_status_idx" ON "SafetyTrainingRequest"("status");

-- CreateIndex
CREATE INDEX "SafetyTrainingRequest_createdAt_idx" ON "SafetyTrainingRequest"("createdAt");

-- CreateIndex
CREATE INDEX "SafetyChecklistSubmission_userId_idx" ON "SafetyChecklistSubmission"("userId");

-- CreateIndex
CREATE INDEX "SafetyChecklistSubmission_createdAt_idx" ON "SafetyChecklistSubmission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_code_key" ON "StaffInvite"("code");

-- CreateIndex
CREATE INDEX "StaffInvite_status_idx" ON "StaffInvite"("status");

-- CreateIndex
CREATE INDEX "StaffInvite_createdById_idx" ON "StaffInvite"("createdById");

-- CreateIndex
CREATE INDEX "StaffInvite_roleId_idx" ON "StaffInvite"("roleId");

-- CreateIndex
CREATE INDEX "StaffInvite_expiresAt_idx" ON "StaffInvite"("expiresAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trader" ADD CONSTRAINT "Trader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderDocument" ADD CONSTRAINT "TraderDocument_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "Trader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipant" ADD CONSTRAINT "AuctionParticipant_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionParticipant" ADD CONSTRAINT "AuctionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionImage" ADD CONSTRAINT "AuctionImage_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentTask" ADD CONSTRAINT "AgentTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StolenReport" ADD CONSTRAINT "StolenReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeItem" ADD CONSTRAINT "KnowledgeItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyIncidentReport" ADD CONSTRAINT "SafetyIncidentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTrainingRequest" ADD CONSTRAINT "SafetyTrainingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyTrainingRequest" ADD CONSTRAINT "SafetyTrainingRequest_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SafetyTrainingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyChecklistSubmission" ADD CONSTRAINT "SafetyChecklistSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffInvite" ADD CONSTRAINT "StaffInvite_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
