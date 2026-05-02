import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find user's team in this hackathon
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: {
          hackathonId: params.hackathonId,
        },
      },
      include: {
        team: {
          include: {
            members: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ data: [] });
    }

    const teamMemberIds = teamMember.team.members.map((m) => m.userId);

    // Get all tickets created by team members
    const tickets = await prisma.helpTicket.findMany({
      where: {
        hackathonId: params.hackathonId,
        creatorId: { in: teamMemberIds },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('Get team tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
