/*
  Warnings:

  - Made the column `role` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "TeamMentor" DROP CONSTRAINT "TeamMentor_mentorId_fkey";

-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN     "prizeDetails" JSONB;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'PARTICIPANT';

-- CreateIndex
CREATE INDEX "ChatMessage_teamId_createdAt_idx" ON "ChatMessage"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "JoinRequest_teamId_status_idx" ON "JoinRequest"("teamId", "status");

-- CreateIndex
CREATE INDEX "Submission_hackathonId_status_idx" ON "Submission"("hackathonId", "status");

-- AddForeignKey
ALTER TABLE "TeamMentor" ADD CONSTRAINT "TeamMentor_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
