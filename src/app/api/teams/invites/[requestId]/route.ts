import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invite = await prisma.joinRequest.findUnique({
      where: { id: params.requestId },
      include: { team: true },
    });

    if (!invite || invite.userId !== user.id) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invite already processed' }, { status: 400 });
    }

    const attendance = await prisma.attendance.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId: invite.team.hackathonId,
          userId: user.id,
        },
      },
    });
    if (!attendance) {
      return NextResponse.json({ error: 'Register for this hackathon first' }, { status: 400 });
    }

    const existingTeam = await prisma.teamMember.findFirst({
      where: {
        userId: user.id,
        team: { hackathonId: invite.team.hackathonId },
      },
    });
    if (existingTeam) {
      return NextResponse.json({ error: 'You are already in a team for this hackathon' }, { status: 400 });
    }

    const memberCount = await prisma.teamMember.count({
      where: { teamId: invite.teamId },
    });
    if (memberCount >= invite.team.maxMembers) {
      return NextResponse.json({ error: 'Team is already full' }, { status: 400 });
    }

    await prisma.teamMember.create({
      data: {
        teamId: invite.teamId,
        userId: user.id,
        role: 'member',
      },
    });

    const updated = await prisma.joinRequest.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });

    return NextResponse.json({ message: 'Invite accepted', data: updated });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invite = await prisma.joinRequest.findUnique({ where: { id: params.requestId } });
    if (!invite || invite.userId !== user.id) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    const updated = await prisma.joinRequest.update({
      where: { id: invite.id },
      data: { status: 'REJECTED', respondedAt: new Date() },
    });

    return NextResponse.json({ message: 'Invite rejected', data: updated });
  } catch (error) {
    console.error('Reject invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
