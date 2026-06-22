-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('pending', 'partial', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('friend', 'phone', 'qr');

-- CreateEnum
CREATE TYPE "ApprovalRecipientStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "DelegationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'negotiating', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ShareLevel" AS ENUM ('full', 'freebusy', 'invite_only');

-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('active', 'revoked');

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "priority" TEXT,
    "categoryId" TEXT,
    "estimatedMinutes" INTEGER,
    "defaultDuration" INTEGER,
    "defaultNature" TEXT,
    "config" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "remindAt" TIMESTAMPTZ NOT NULL,
    "leadMinutes" INTEGER NOT NULL DEFAULT 15,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_requests" (
    "id" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'life',
    "nature" TEXT NOT NULL DEFAULT 'PUBLIC',
    "categoryId" TEXT,
    "circleId" TEXT,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'pending',
    "shareToken" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_recipients" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "contactValue" TEXT,
    "userId" TEXT,
    "status" "ApprovalRecipientStatus" NOT NULL DEFAULT 'pending',
    "blockId" TEXT,
    "notifiedAt" TIMESTAMPTZ,
    "respondedAt" TIMESTAMPTZ,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "approval_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegations" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "recipientPhone" TEXT,
    "shareToken" TEXT NOT NULL,
    "stepId" TEXT,
    "taskId" TEXT,
    "blockId" TEXT,
    "candidateSlots" JSONB,
    "status" "DelegationStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "deadline" TIMESTAMPTZ,
    "acceptedSlot" JSONB,
    "deliverNote" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_recipients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "level" "ShareLevel" NOT NULL DEFAULT 'freebusy',
    "status" "ShareStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMPTZ,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "share_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_cards" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "busySlots" JSONB NOT NULL,
    "freeSlots" JSONB NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '[]',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "share_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "templates_userId_type_idx" ON "templates"("userId", "type");

-- CreateIndex
CREATE INDEX "reminders_userId_idx" ON "reminders"("userId");

-- CreateIndex
CREATE INDEX "reminders_blockId_idx" ON "reminders"("blockId");

-- CreateIndex
CREATE INDEX "reminders_remindAt_status_idx" ON "reminders"("remindAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "approval_requests_shareToken_key" ON "approval_requests"("shareToken");

-- CreateIndex
CREATE INDEX "approval_requests_initiatorId_idx" ON "approval_requests"("initiatorId");

-- CreateIndex
CREATE INDEX "approval_requests_blockId_idx" ON "approval_requests"("blockId");

-- CreateIndex
CREATE INDEX "approval_requests_shareToken_idx" ON "approval_requests"("shareToken");

-- CreateIndex
CREATE INDEX "approval_recipients_requestId_idx" ON "approval_recipients"("requestId");

-- CreateIndex
CREATE INDEX "approval_recipients_userId_idx" ON "approval_recipients"("userId");

-- CreateIndex
CREATE INDEX "approval_recipients_blockId_idx" ON "approval_recipients"("blockId");

-- CreateIndex
CREATE UNIQUE INDEX "approval_recipients_requestId_contactType_contactValue_key" ON "approval_recipients"("requestId", "contactType", "contactValue");

-- CreateIndex
CREATE UNIQUE INDEX "delegations_shareToken_key" ON "delegations"("shareToken");

-- CreateIndex
CREATE INDEX "delegations_initiatorId_idx" ON "delegations"("initiatorId");

-- CreateIndex
CREATE INDEX "delegations_recipientUserId_idx" ON "delegations"("recipientUserId");

-- CreateIndex
CREATE INDEX "delegations_shareToken_idx" ON "delegations"("shareToken");

-- CreateIndex
CREATE INDEX "delegations_status_idx" ON "delegations"("status");

-- CreateIndex
CREATE INDEX "share_recipients_userId_idx" ON "share_recipients"("userId");

-- CreateIndex
CREATE INDEX "share_recipients_targetUserId_idx" ON "share_recipients"("targetUserId");

-- CreateIndex
CREATE INDEX "share_recipients_expiresAt_idx" ON "share_recipients"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "share_recipients_userId_targetUserId_key" ON "share_recipients"("userId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "share_cards_token_key" ON "share_cards"("token");

-- CreateIndex
CREATE INDEX "share_cards_userId_idx" ON "share_cards"("userId");

-- CreateIndex
CREATE INDEX "event_logs_userId_eventType_idx" ON "event_logs"("userId", "eventType");

-- CreateIndex
CREATE INDEX "event_logs_eventType_createdAt_idx" ON "event_logs"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "time_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "time_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_recipients" ADD CONSTRAINT "approval_recipients_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "approval_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_recipients" ADD CONSTRAINT "approval_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_recipients" ADD CONSTRAINT "approval_recipients_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "time_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "time_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_recipients" ADD CONSTRAINT "share_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_recipients" ADD CONSTRAINT "share_recipients_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_cards" ADD CONSTRAINT "share_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
