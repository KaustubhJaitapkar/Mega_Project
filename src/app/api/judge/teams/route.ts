import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseHackathonMeta } from '@/lib/hackathonMeta';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hackathonId = new URL(req.url).searchParams.get('hackathonId');
    if (!hackathonId) {
      return NextResponse.json({ error: 'hackathonId is required' }, { status: 400 });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        judges: { select: { id: true } },
        teams: { include: { submission: true }, orderBy: { name: 'asc' } },
      },
    });
    if (!hackathon || !hackathon.judges.some((j) => j.id === user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const meta = parseHackathonMeta(hackathon.rules);
    const blindMode = !!meta.blindMode;
    const anonymousMap = meta.anonymousMap || {};

    const teams = await Promise.all(
      hackathon.teams.map(async (team) => {
        const scoreCount = team.submission
          ? await prisma.score.count({
              where: { submissionId: team.submission.id, judgerId: user.id },
            })
          : 0;

        return {
          id: team.id,
          name: blindMode ? anonymousMap[team.id] || team.name : team.name,
          realName: team.name,
          submissionId: team.submission?.id || null,
          scored: scoreCount > 0,
        };
      })
    );

    return NextResponse.json({
      data: {
        blindMode,
        teams,
        scored: teams.filter((t) => t.scored).length,
        pending: teams.filter((t) => !t.scored).length,
      },
    });
  } catch (error) {
    console.error('Judge teams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

