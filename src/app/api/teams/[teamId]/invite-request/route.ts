import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inviter = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!inviter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: { members: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    if (team.creatorId !== inviter.id) {
      return NextResponse.json({ error: 'Only team lead can invite teammates' }, { status: 403 });
    }

    const body = await req.json();
    const userId = body?.userId as string | undefined;
    const message = (body?.message || '').toString();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } },
    });
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    const existingRequest = await prisma.joinRequest.findUnique({
      where: { teamId_userId: { teamId: team.id, userId } },
    });
    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json({ error: 'Invite already pending' }, { status: 400 });
    }

    const request = await prisma.joinRequest.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      create: {
        teamId: team.id,
        userId,
        requestedById: inviter.id,
        message,
      },
      update: {
        status: 'PENDING',
        requestedById: inviter.id,
        message,
      },
    });

    return NextResponse.json({ message: 'Invite sent', data: request });
  } catch (error) {
    console.error('Invite teammate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
