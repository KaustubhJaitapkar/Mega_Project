/*
  Warnings:

  - You are about to drop the column `allowedDomains` on the `Hackathon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Hackathon" DROP COLUMN "allowedDomains";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "skillsNeeded" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "TeamRequirement" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "skillsNeeded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementInterest" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequirementInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeamRequirement_teamId_idx" ON "TeamRequirement"("teamId");

-- CreateIndex
CREATE INDEX "TeamRequirement_isActive_idx" ON "TeamRequirement"("isActive");

-- CreateIndex
CREATE INDEX "RequirementInterest_requirementId_idx" ON "RequirementInterest"("requirementId");

-- CreateIndex
CREATE INDEX "RequirementInterest_userId_idx" ON "RequirementInterest"("userId");

-- CreateIndex
CREATE INDEX "RequirementInterest_status_idx" ON "RequirementInterest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementInterest_requirementId_userId_key" ON "RequirementInterest"("requirementId", "userId");

-- AddForeignKey
ALTER TABLE "TeamRequirement" ADD CONSTRAINT "TeamRequirement_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementInterest" ADD CONSTRAINT "RequirementInterest_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "TeamRequirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementInterest" ADD CONSTRAINT "RequirementInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
