import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser, isErrorResponse } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const userOrError = await getAuthUser();
    if (!userOrError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUser = userOrError;

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true, profile: true } },
          },
        },
        submission: true,
        joinRequests: {
          include: {
            team: true,
          },
        },
        hackathon: { select: { organiserId: true } },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Allow: team members, team creator, hackathon organizer, judges
    const isMember = team.members.some((m) => m.userId === currentUser.id);
    const isCreator = team.creatorId === currentUser.id;
    const isOrganizer = team.hackathon?.organiserId === currentUser.id;
    const isJudge = currentUser.role === 'JUDGE';

    if (!isMember && !isCreator && !isOrganizer && !isJudge) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Strip join requests from non-organizers/non-creators to protect privacy
    const { hackathon: _h, ...teamData } = team as any;
    const response = isOrganizer || isCreator
      ? teamData
      : { ...teamData, joinRequests: undefined };

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await req.json();
    const updatedTeam = await prisma.team.update({
      where: { id: params.teamId },
      data: body,
      include: {
        members: { include: { user: true } },
      },
    });

    return NextResponse.json({
      message: 'Team updated successfully',
      data: updatedTeam,
    });
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
