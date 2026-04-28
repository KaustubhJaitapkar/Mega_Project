-- CreateEnum
CREATE TYPE "CloneStatus" AS ENUM ('NOT_CLONED', 'CLONING', 'CLONED', 'FAILED');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "breakfastRedeemed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lunchRedeemed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "swagCollected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN     "allowCrossYearTeams" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowedDepartments" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bannerUrl" TEXT,
ADD COLUMN     "breakfastProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "dinnerProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eligibilityDomain" TEXT,
ADD COLUMN     "hostName" TEXT,
ADD COLUMN     "internalMentors" JSONB,
ADD COLUMN     "judgeDetails" JSONB,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "lunchProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mealSchedule" JSONB,
ADD COLUMN     "mentorDetails" JSONB,
ADD COLUMN     "rubricItems" JSONB,
ADD COLUMN     "sponsorDetails" JSONB,
ADD COLUMN     "submissionRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "swagProvided" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "targetBatches" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "theme" TEXT,
ADD COLUMN     "themedTracks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "isLookingForTeam" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "cloneError" TEXT,
ADD COLUMN     "cloneStatus" "CloneStatus" NOT NULL DEFAULT 'NOT_CLONED',
ADD COLUMN     "clonedAt" TIMESTAMP(3),
ADD COLUMN     "codeCachePath" TEXT,
ADD COLUMN     "pitchDeckUrl" TEXT;
