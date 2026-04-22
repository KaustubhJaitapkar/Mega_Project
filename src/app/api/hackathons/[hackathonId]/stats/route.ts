import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: {
        _count: {
          select: {
            teams: true,
            submissions: true,
            attendances: true,
          },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // Calculate advanced stats
    const submissions = await prisma.submission.findMany({
      where: { hackathonId: params.hackathonId },
    });

    const scores = await prisma.score.findMany({
      where: {
        submission: {
          hackathonId: params.hackathonId,
        },
      },
    });

    const teams = await prisma.team.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        members: {
          include: {
            user: {
              include: { profile: true },
            },
          },
        },
      },
    });

    const tickets = await prisma.helpTicket.count({
      where: {
        hackathonId: params.hackathonId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    const submittedCount = submissions.filter((s) => s.status === 'SUBMITTED').length;
    const healthyCount = submissions.filter((s) => s.isHealthy).length;
    const averageTeamSize =
      teams.length > 0
        ? teams.reduce((sum, t) => sum + t.members.length, 0) / teams.length
        : 0;
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length 
      : 0;

    const teamDistribution = teams.reduce((acc: Record<number, number>, team) => {
      const size = team.members.length;
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {});

    const skillHeatmap: Record<string, number> = {};
    teams.forEach((team) => {
      team.members.forEach((member) => {
        const skills = member.user.profile?.skills || [];
        skills.forEach((s) => {
          skillHeatmap[s] = (skillHeatmap[s] || 0) + 1;
        });
      });
    });

    const trends = {
      timestamp: new Date().toISOString(),
      teamCount: hackathon._count.teams,
      submissionCount: submittedCount,
      openTickets: tickets,
    };

    return NextResponse.json({
      data: {
        totalTeams: hackathon._count.teams,
        participantsCount: teams.reduce((sum, t) => sum + t.members.length, 0),
        totalSubmissions: hackathon._count.submissions,
        submittedCount,
        healthyCount,
        openTickets: tickets,
        totalAttendances: hackathon._count.attendances,
        averageTeamSize: Math.round(averageTeamSize * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        totalScores: scores.length,
        teamDistribution,
        skillHeatmap: Object.entries(skillHeatmap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .map(([skill, count]) => ({ skill, count })),
        trends,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
