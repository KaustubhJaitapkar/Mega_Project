import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check hackathon exists and is not DRAFT
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: { status: true, organiserId: true },
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    // Only the organizer can see rankings during DRAFT
    if (hackathon.status === 'DRAFT' && hackathon.organiserId !== currentUser.id) {
      return NextResponse.json({ error: 'Rankings are not available yet' }, { status: 403 });
    }

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
