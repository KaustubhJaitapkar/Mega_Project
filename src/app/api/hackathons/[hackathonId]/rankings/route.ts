import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, requireOrganizerOf, isErrorResponse } from '@/lib/api-auth';
import { computeTeamRankings } from '@/lib/scoring';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: { status: true, organiserId: true, rankings: true },
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    // Only the organizer can see rankings during DRAFT
    if (hackathon.status === 'DRAFT' && hackathon.organiserId !== currentUser.id) {
      return NextResponse.json({ error: 'Rankings are not available yet' }, { status: 403 });
    }

    // Return stored rankings from JSON field
    const storedRankings = (hackathon.rankings as any[]) || [];

    return NextResponse.json({ data: storedRankings });
  } catch (error) {
    console.error('Get rankings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const userOrError = await requireOrganizerOf(params.hackathonId);
    if (isErrorResponse(userOrError)) return userOrError;

    // Check hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: { id: true },
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    // Get teams and compute rankings
    const teams = await prisma.team.findMany({
      where: { hackathonId: params.hackathonId },
      select: { id: true, name: true },
    });

    const { scores: teamScores, judgeCounts } = await computeTeamRankings(params.hackathonId);

    const ranking = teams
      .map((team) => ({
        teamId: team.id,
        teamName: team.name,
        totalScore: Math.round((teamScores.get(team.id) || 0) * 100) / 100,
        judgeCount: judgeCounts.get(team.id) || 0,
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    // Store rankings in JSON field
    await prisma.hackathon.update({
      where: { id: params.hackathonId },
      data: { rankings: ranking as any },
    });

    return NextResponse.json({ data: ranking });
  } catch (error) {
    console.error('Generate rankings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
