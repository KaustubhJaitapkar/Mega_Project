-- CreateTable
CREATE TABLE "Ranking" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "judgeCount" INTEGER NOT NULL DEFAULT 0,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ranking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ranking_hackathonId_idx" ON "Ranking"("hackathonId");

-- CreateIndex
CREATE INDEX "Ranking_hackathonId_rank_idx" ON "Ranking"("hackathonId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_hackathonId_teamId_key" ON "Ranking"("hackathonId", "teamId");

-- AddForeignKey
ALTER TABLE "Ranking" ADD CONSTRAINT "Ranking_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
