/*
  Warnings:

  - You are about to drop the `Ranking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ranking" DROP CONSTRAINT "Ranking_hackathonId_fkey";

-- AlterTable
ALTER TABLE "Hackathon" ADD COLUMN     "rankings" JSONB;

-- DropTable
DROP TABLE "Ranking";
