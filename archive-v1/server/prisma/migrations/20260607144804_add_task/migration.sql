-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "taskGroupId" UUID,
    "title" VARCHAR(200) NOT NULL,
    "notes" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tasks_user_status_due_idx" ON "tasks"("userId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "tasks_user_due_idx" ON "tasks"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "tasks_group_order_idx" ON "tasks"("taskGroupId", "sortOrder");

-- CreateIndex
CREATE INDEX "tasks_delflag_idx" ON "tasks"("isDeleted");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_taskGroupId_fkey" FOREIGN KEY ("taskGroupId") REFERENCES "task_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
