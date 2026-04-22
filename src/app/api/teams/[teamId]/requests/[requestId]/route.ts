import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || team.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: 'Join request not found' },
        { status: 404 }
      );
    }

    if (joinRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Join request already processed' },
        { status: 400 }
      );
    }

    const memberCount = await prisma.teamMember.count({
      where: { teamId: params.teamId },
    });
    if (memberCount >= team.maxMembers) {
      return NextResponse.json(
        { error: 'Team is already full' },
        { status: 400 }
      );
    }

    const existingTeam = await prisma.teamMember.findFirst({
      where: {
        userId: joinRequest.userId,
        team: { hackathonId: team.hackathonId },
      },
    });
    if (existingTeam) {
      return NextResponse.json(
        { error: 'User already in a team for this hackathon' },
        { status: 400 }
      );
    }

    // Accept join request
    const updatedRequest = await prisma.joinRequest.update({
      where: { id: params.requestId },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });

    // Add user to team
    await prisma.teamMember.create({
      data: {
        teamId: params.teamId,
        userId: joinRequest.userId,
        role: 'member',
      },
    });

    return NextResponse.json({
      message: 'Join request accepted',
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Accept join request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { teamId: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || team.creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Reject join request
    await prisma.joinRequest.update({
      where: { id: params.requestId },
      data: { status: 'REJECTED', respondedAt: new Date() },
    });

    return NextResponse.json({
      message: 'Join request rejected',
    });
  } catch (error) {
    console.error('Reject join request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
