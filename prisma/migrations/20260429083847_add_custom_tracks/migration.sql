-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN     "allowedDomains" TEXT[] DEFAULT ARRAY[]::TEXT[];
