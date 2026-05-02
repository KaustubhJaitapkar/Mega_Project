import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string; requirementId: string } }
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

    // Verify requirement exists and belongs to hackathon
    const requirement = await prisma.teamRequirement.findUnique({
      where: { id: params.requirementId },
      include: {
        team: {
          include: {
            members: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    if (!requirement || requirement.team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Check if user is team leader
    const isLeader = requirement.team.members.some((m) => m.role === 'leader');
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only team leaders can view interests' },
        { status: 403 }
      );
    }

    // Fetch interests with user details
    const interests = await prisma.requirementInterest.findMany({
      where: { requirementId: params.requirementId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const interestsWithDetails = interests.map((interest) => ({
      id: interest.id,
      status: interest.status,
      message: interest.message,
      createdAt: interest.createdAt,
      user: {
        id: interest.user.id,
        name: interest.user.name,
        image: interest.user.image,
        profile: interest.user.profile,
      },
    }));

    return NextResponse.json({ data: interestsWithDetails });
  } catch (error) {
    console.error('Get requirement interests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
