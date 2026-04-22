import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { teamJoinSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { emitJoinRequest } from '@/lib/socket';

export async function POST(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = teamJoinSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    if (user.role !== 'PARTICIPANT') {
      return NextResponse.json(
        { error: 'Only participants can join teams' },
        { status: 403 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId: team.hackathonId,
          userId: user.id,
        },
      },
    });
    if (!attendance) {
      return NextResponse.json(
        { error: 'Register for this hackathon before joining teams' },
        { status: 400 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a team member' },
        { status: 400 }
      );
    }

    // Check for existing join request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Join request already pending' },
        { status: 400 }
      );
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        teamId: params.teamId,
        userId: user.id,
        requestedById: user.id,
        message: validatedData.message,
      },
      include: {
        team: true,
      },
    });

    // Emit socket event
    emitJoinRequest(params.teamId, {
      id: joinRequest.id,
      userId: user.id,
      userName: user.name,
      message: validatedData.message,
    });

    return NextResponse.json(
      {
        message: 'Join request sent successfully',
        data: joinRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      );
    }

    console.error('Join team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
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

    const requestId = new URL(req.url).searchParams.get('requestId');
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
    });

    if (
      !joinRequest ||
      joinRequest.teamId !== params.teamId ||
      joinRequest.requestedById !== user.id ||
      joinRequest.status !== 'PENDING'
    ) {
      return NextResponse.json({ error: 'Pending request not found' }, { status: 404 });
    }

    await prisma.joinRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ message: 'Join request cancelled' });
  } catch (error) {
    console.error('Cancel join request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
