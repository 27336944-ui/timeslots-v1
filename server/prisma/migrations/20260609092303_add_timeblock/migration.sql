-- CreateTable
CREATE TABLE "time_blocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "time_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_blocks_userId_idx" ON "time_blocks"("userId");

-- CreateIndex
CREATE INDEX "time_blocks_startTime_idx" ON "time_blocks"("startTime");

-- AddForeignKey
ALTER TABLE "time_blocks" ADD CONSTRAINT "time_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
