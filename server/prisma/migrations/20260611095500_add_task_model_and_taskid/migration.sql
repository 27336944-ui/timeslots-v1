-- This migration captures the schema state changes from v0.13 Task model
-- and v0.14 TimeBlock.taskId. DB already synced via prisma db push.
-- Marked as applied via: prisma migrate resolve --applied add_task_model_and_taskid

-- CreateTable: tasks
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "goal" TEXT,
    "steps" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT NOT NULL DEFAULT 'life',
    "dueAt" TIMESTAMPTZ,
    "completedNote" TEXT,
    "retrospective" TEXT,
    "improvements" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AlterTable: time_blocks add taskId
ALTER TABLE "time_blocks" ADD COLUMN "taskId" TEXT;

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");
CREATE INDEX "tasks_userId_category_idx" ON "tasks"("userId", "category");
CREATE INDEX "time_blocks_taskId_idx" ON "time_blocks"("taskId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
