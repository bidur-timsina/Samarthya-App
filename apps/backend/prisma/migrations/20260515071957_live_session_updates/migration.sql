-- DropForeignKey
ALTER TABLE "live_sessions" DROP CONSTRAINT "live_sessions_courseId_fkey";

-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "externalLink" TEXT,
ALTER COLUMN "courseId" DROP NOT NULL,
ALTER COLUMN "scheduledAt" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
