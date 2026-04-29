import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireOrganizerOf, isErrorResponse } from '@/lib/api-auth';
import { computeTeamRankings } from '@/lib/scoring';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const userOrError = await requireOrganizerOf(params.hackathonId);
    if (isErrorResponse(userOrError)) return userOrError;

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: { 
        title: true,
        prize: true,
        prizeDetails: true,
      },
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    // Get all teams with members
    const teams = await prisma.team.findMany({
      where: { hackathonId: params.hackathonId },
      select: { 
        id: true, 
        name: true,
        members: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Get rankings
    const { scores: teamScores, judgeCounts } = await computeTeamRankings(params.hackathonId);

    // Get certificates/winners
    const certificates = await prisma.certificate.findMany({
      where: { 
        hackathonId: params.hackathonId,
        type: { in: ['WINNER', 'RUNNER_UP', 'BEST_PROJECT'] },
      },
      select: {
        teamId: true,
        type: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Build team data with members and scores
    const teamData = teams.map((team) => {
      const totalScore = Math.round((teamScores.get(team.id) || 0) * 100) / 100;
      const judgeCount = judgeCounts.get(team.id) || 0;
      const teamCertificates = certificates.filter((c) => c.teamId === team.id);
      
      return {
        teamId: team.id,
        teamName: team.name,
        totalScore,
        judgeCount,
        members: team.members.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
        })),
        certificates: teamCertificates.map((c) => c.type),
      };
    });

    // Sort by score
    const rankedTeams = teamData
      .sort((a, b) => b.totalScore - a.totalScore)
      .map((team, index) => ({
        ...team,
        rank: index + 1,
      }));

    return NextResponse.json({ 
      data: {
        hackathon: {
          title: hackathon.title,
          prize: hackathon.prize,
          prizeDetails: hackathon.prizeDetails,
        },
        teams: rankedTeams,
      },
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
