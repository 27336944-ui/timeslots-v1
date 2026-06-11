-- CreateEnum
CREATE TYPE "TimeBlockStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimeBlockNature" AS ENUM ('PRIVATE', 'PUBLIC', 'CIRCLE_ONLY');

-- CreateEnum
CREATE TYPE "CircleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CircleRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEDUCT', 'REFUND', 'GRANT', 'EXPIRE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "openid" VARCHAR(64),
    "unionid" VARCHAR(64),
    "nickname" VARCHAR(50),
    "avatarUrl" VARCHAR(500),
    "dayStartsAt" VARCHAR(5) NOT NULL DEFAULT '00:00',
    "coachSettings" JSONB NOT NULL DEFAULT '{"tone":"professional","weeklyReportDay":"SUNDAY"}',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_blocks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "summary" TEXT,
    "encryptedDetails" JSONB,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6) NOT NULL,
    "status" "TimeBlockStatus" NOT NULL DEFAULT 'ACTIVE',
    "nature" "TimeBlockNature" NOT NULL DEFAULT 'PRIVATE',
    "actualDurationMinutes" INTEGER,
    "isAIGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiTraceId" VARCHAR(64),
    "isBusy" BOOLEAN NOT NULL DEFAULT true,
    "taskGroupId" UUID,
    "circleId" UUID,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circles" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "status" "CircleStatus" NOT NULL DEFAULT 'ACTIVE',
    "inviteCode" VARCHAR(20) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "circles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "circle_members" (
    "id" UUID NOT NULL,
    "circleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "CircleRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "circle_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_groups" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "color" VARCHAR(10) NOT NULL DEFAULT '#888888',
    "notes" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "task_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "blockId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" UUID,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvps" (
    "id" UUID NOT NULL,
    "blockId" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'CONFIRMED',
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_cards" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "weekStart" DATE NOT NULL,
    "insights" JSONB NOT NULL,
    "metrics" JSONB,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "coach_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_feedbacks" (
    "id" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "coach_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotas" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permanentPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyExpireAt" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "relatedBlockId" UUID,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "quota_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_openid_key" ON "users"("openid");

-- CreateIndex
CREATE INDEX "users_openid_uk" ON "users"("openid");

-- CreateIndex
CREATE INDEX "users_delflag_idx" ON "users"("isDeleted");

-- CreateIndex
CREATE INDEX "time_blocks_user_time_idx" ON "time_blocks"("userId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "time_blocks_circle_time_idx" ON "time_blocks"("circleId", "startTime");

-- CreateIndex
CREATE INDEX "time_blocks_group_status_idx" ON "time_blocks"("taskGroupId", "status");

-- CreateIndex
CREATE INDEX "time_blocks_delflag_idx" ON "time_blocks"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "circles_inviteCode_key" ON "circles"("inviteCode");

-- CreateIndex
CREATE INDEX "circles_owner_idx" ON "circles"("ownerId");

-- CreateIndex
CREATE INDEX "circles_delflag_idx" ON "circles"("isDeleted");

-- CreateIndex
CREATE INDEX "circle_members_user_idx" ON "circle_members"("userId");

-- CreateIndex
CREATE INDEX "circle_members_delflag_idx" ON "circle_members"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "circle_members_circleId_userId_key" ON "circle_members"("circleId", "userId");

-- CreateIndex
CREATE INDEX "task_groups_user_delflag_idx" ON "task_groups"("userId", "isDeleted");

-- CreateIndex
CREATE INDEX "comments_block_idx" ON "comments"("blockId");

-- CreateIndex
CREATE INDEX "comments_delflag_idx" ON "comments"("isDeleted");

-- CreateIndex
CREATE INDEX "rsvps_delflag_idx" ON "rsvps"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_blockId_attendeeId_key" ON "rsvps"("blockId", "attendeeId");

-- CreateIndex
CREATE INDEX "coach_cards_delflag_idx" ON "coach_cards"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "coach_cards_userId_weekStart_key" ON "coach_cards"("userId", "weekStart");

-- CreateIndex
CREATE INDEX "coach_feedbacks_card_idx" ON "coach_feedbacks"("cardId");

-- CreateIndex
CREATE INDEX "coach_feedbacks_delflag_idx" ON "coach_feedbacks"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "quotas_userId_key" ON "quotas"("userId");

-- CreateIndex
CREATE INDEX "quotas_delflag_idx" ON "quotas"("isDeleted");

-- CreateIndex
CREATE INDEX "quota_txns_user_time_idx" ON "quota_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "quota_txns_delflag_idx" ON "quota_transactions"("isDeleted");

-- AddForeignKey
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_taskGroupId_fkey" FOREIGN KEY ("taskGroupId") REFERENCES "task_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circles" ADD CONSTRAINT "circles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circleId_fkey" FOREIGN KEY ("circleId") REFERENCES "circles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_groups" ADD CONSTRAINT "task_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "time_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "time_blocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_cards" ADD CONSTRAINT "coach_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_feedbacks" ADD CONSTRAINT "coach_feedbacks_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "coach_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotas" ADD CONSTRAINT "quotas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_transactions" ADD CONSTRAINT "quota_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
