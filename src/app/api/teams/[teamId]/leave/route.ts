import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: { teamId: string } }
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

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
      include: {
        team: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 404 });
    }

    if (membership.role === 'leader') {
      return NextResponse.json(
        { error: 'Leader cannot leave the team. Transfer leadership first or delete team.' },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { id: membership.id },
    });

    return NextResponse.json({ message: 'Left team successfully' });
  } catch (error) {
    console.error('Leave team error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
