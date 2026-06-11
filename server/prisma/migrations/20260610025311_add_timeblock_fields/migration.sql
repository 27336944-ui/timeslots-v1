-- AlterTable
ALTER TABLE "time_blocks" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'life',
ADD COLUMN     "contacts" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'medium',
ADD COLUMN     "recurrence" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "weather" TEXT;
