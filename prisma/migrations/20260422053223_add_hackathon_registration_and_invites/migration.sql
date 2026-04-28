-- AlterTable
ALTER TABLE "JoinRequest" ADD COLUMN     "requestedById" TEXT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP NOT NULL,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "HackathonRegistration" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "instituteName" TEXT NOT NULL,
    "differentlyAbled" BOOLEAN NOT NULL DEFAULT false,
    "userType" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "courseSpecialization" TEXT NOT NULL,
    "graduatingYear" INTEGER NOT NULL,
    "courseDuration" TEXT NOT NULL,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HackathonRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HackathonRegistration_hackathonId_idx" ON "HackathonRegistration"("hackathonId");

-- CreateIndex
CREATE INDEX "HackathonRegistration_userId_idx" ON "HackathonRegistration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HackathonRegistration_hackathonId_userId_key" ON "HackathonRegistration"("hackathonId", "userId");

-- CreateIndex
CREATE INDEX "JoinRequest_requestedById_idx" ON "JoinRequest"("requestedById");

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonRegistration" ADD CONSTRAINT "HackathonRegistration_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HackathonRegistration" ADD CONSTRAINT "HackathonRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
