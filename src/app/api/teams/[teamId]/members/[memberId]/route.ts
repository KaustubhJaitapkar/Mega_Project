import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _req: Request,
  { params }: { params: { teamId: string; memberId: string } }
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

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });

    if (!team || team.creatorId !== user.id) {
      return NextResponse.json({ error: 'Only team lead can remove members' }, { status: 403 });
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: params.memberId },
    });

    if (!member || member.teamId !== params.teamId) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (member.role === 'leader') {
      return NextResponse.json({ error: 'Cannot remove team leader' }, { status: 400 });
    }

    await prisma.teamMember.delete({ where: { id: params.memberId } });

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
