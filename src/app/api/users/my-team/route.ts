import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find all teams this user is a member of, with hackathon context
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: {
        team: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                status: true,
                submissionDeadline: true,
              },
            },
            submission: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    // Return teams sorted by hackathon status priority (ONGOING first, then REGISTRATION)
    const statusOrder: Record<string, number> = {
      ONGOING: 0,
      REGISTRATION: 1,
      ENDED: 2,
      DRAFT: 3,
      CANCELLED: 4,
    };

    const teams = memberships
      .map((m) => ({
        teamId: m.team.id,
        teamName: m.team.name,
        role: m.role,
        hackathonId: m.team.hackathon.id,
        hackathonTitle: m.team.hackathon.title,
        hackathonStatus: m.team.hackathon.status,
        submissionDeadline: m.team.hackathon.submissionDeadline,
        submissionStatus: m.team.submission?.status || null,
      }))
      .sort((a, b) => (statusOrder[a.hackathonStatus] ?? 5) - (statusOrder[b.hackathonStatus] ?? 5));

    return NextResponse.json({ data: teams });
  } catch (error) {
    console.error('My team fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
