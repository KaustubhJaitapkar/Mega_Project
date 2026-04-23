import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const teams = await prisma.team.findMany({
      where: { hackathonId: params.hackathonId },
      select: { id: true, name: true },
    });

    const scores = await prisma.score.findMany({
      where: {
        submission: {
          hackathonId: params.hackathonId,
        },
      },
      include: {
        submission: { select: { teamId: true } },
      },
    });

    const totals = new Map<string, number>();
    teams.forEach((team) => totals.set(team.id, 0));

    for (const score of scores) {
      const teamId = score.submission?.teamId;
      if (!teamId) continue;
      totals.set(teamId, (totals.get(teamId) || 0) + score.score);
    }

    const ranking = teams
      .map((team) => ({
        teamId: team.id,
        teamName: team.name,
        totalScore: totals.get(team.id) || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return NextResponse.json({ data: ranking });
  } catch (error) {
    console.error('Get rankings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
