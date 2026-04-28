import { prisma } from '@/lib/prisma';

interface RubricItemInfo {
  id: string;
  weight: number;
  maxScore: number;
}

interface ScoreRecord {
  score: number;
  rubricItemId: string;
  judgerId: string;
  submission: { teamId: string | null } | null;
}

/**
 * Calculates the weighted score for a single judge on a single submission.
 * Formula: SUM((score / maxScore) * weight) for each rubric item.
 * Returns a score normalized to the sum of weights (typically 0-100).
 */
export function calculateWeightedScore(
  judgeScores: { rubricItemId: string; score: number }[],
  rubricItemMap: Map<string, RubricItemInfo>
): number {
  let weightedTotal = 0;
  for (const entry of judgeScores) {
    const item = rubricItemMap.get(entry.rubricItemId);
    if (!item) continue;
    weightedTotal += (entry.score / item.maxScore) * item.weight;
  }
  return weightedTotal;
}

/**
 * Computes final scores per team for a hackathon using weighted rubric scoring,
 * averaged across all judges per submission.
 *
 * Returns a Map of teamId -> finalScore, and a Map of teamId -> judgeCount.
 */
export async function computeTeamRankings(hackathonId: string): Promise<{
  scores: Map<string, number>;
  judgeCounts: Map<string, number>;
}> {
  // Fetch the active rubric with items
  const rubric = await prisma.rubric.findFirst({
    where: { hackathonId },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const rubricItemMap = new Map<string, RubricItemInfo>();
  if (rubric) {
    for (const item of rubric.items) {
      rubricItemMap.set(item.id, {
        id: item.id,
        weight: item.weight,
        maxScore: item.maxScore,
      });
    }
  }

  // Fetch all scores for the hackathon
  const scores = await prisma.score.findMany({
    where: {
      submission: { hackathonId },
    },
    include: {
      submission: { select: { teamId: true, id: true } },
    },
  });

  // Group scores by submissionId -> judgerId
  const submissionJudgeScores = new Map<string, Map<string, ScoreRecord[]>>();
  for (const score of scores) {
    if (!score.submission?.teamId) continue;
    const subId = score.submissionId;
    if (!submissionJudgeScores.has(subId)) {
      submissionJudgeScores.set(subId, new Map());
    }
    const judgeMap = submissionJudgeScores.get(subId)!;
    if (!judgeMap.has(score.judgerId)) {
      judgeMap.set(score.judgerId, []);
    }
    judgeMap.get(score.judgerId)!.push(score);
  }

  // Calculate per-submission weighted score (averaged across judges)
  const submissionScores = new Map<string, number>();
  const submissionJudgeCounts = new Map<string, number>();

  for (const [subId, judgeMap] of submissionJudgeScores) {
    let totalWeighted = 0;
    for (const [, judgeScores] of judgeMap) {
      totalWeighted += calculateWeightedScore(judgeScores, rubricItemMap);
    }
    const avgWeighted = totalWeighted / judgeMap.size;
    submissionScores.set(subId, avgWeighted);
    submissionJudgeCounts.set(subId, judgeMap.size);
  }

  // Map submission scores to team scores
  const teamScores = new Map<string, number>();
  const teamJudgeCounts = new Map<string, number>();
  const teamSubmissions = new Map<string, string[]>(); // teamId -> submissionIds

  for (const score of scores) {
    const teamId = score.submission?.teamId;
    if (!teamId) continue;
    if (!teamSubmissions.has(teamId)) {
      teamSubmissions.set(teamId, []);
    }
    const subs = teamSubmissions.get(teamId)!;
    if (!subs.includes(score.submissionId)) {
      subs.push(score.submissionId);
    }
  }

  for (const [teamId, subIds] of teamSubmissions) {
    let bestScore = 0;
    let bestJudgeCount = 0;
    for (const subId of subIds) {
      const s = submissionScores.get(subId) || 0;
      if (s > bestScore) {
        bestScore = s;
        bestJudgeCount = submissionJudgeCounts.get(subId) || 0;
      }
    }
    teamScores.set(teamId, bestScore);
    teamJudgeCounts.set(teamId, bestJudgeCount);
  }

  return { scores: teamScores, judgeCounts: teamJudgeCounts };
}
