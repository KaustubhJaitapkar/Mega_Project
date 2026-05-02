import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string; teamId: string } }
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

    // Verify team exists and belongs to hackathon
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });
    if (!team || team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is team leader
    const isLeader = await prisma.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: user.id,
        role: 'leader',
      },
    });

    // Fetch requirements for this team
    const requirements = await prisma.teamRequirement.findMany({
      where: { teamId: params.teamId },
      include: {
        _count: {
          select: { interests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If not leader, only return active requirements
    const filteredRequirements = isLeader
      ? requirements
      : requirements.filter((r) => r.isActive);

    return NextResponse.json({ data: filteredRequirements });
  } catch (error) {
    console.error('Get team requirements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string; teamId: string } }
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

    // Verify team exists and belongs to hackathon
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });
    if (!team || team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is team leader
    const isLeader = await prisma.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: user.id,
        role: 'leader',
      },
    });
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only team leaders can post requirements' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, skillsNeeded } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters' },
        { status: 400 }
      );
    }

    const requirement = await prisma.teamRequirement.create({
      data: {
        teamId: params.teamId,
        title: title.trim(),
        description: description?.trim() || null,
        skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : [],
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: 'Requirement posted successfully', data: requirement },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { hackathonId: string; teamId: string } }
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

    // Verify team exists and belongs to hackathon
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
    });
    if (!team || team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is team leader
    const isLeader = await prisma.teamMember.findFirst({
      where: {
        teamId: params.teamId,
        userId: user.id,
        role: 'leader',
      },
    });
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only team leaders can update requirements' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { requirementId, isActive } = body;

    if (!requirementId) {
      return NextResponse.json(
        { error: 'Requirement ID is required' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    // Verify requirement belongs to this team
    const requirement = await prisma.teamRequirement.findUnique({
      where: { id: requirementId },
    });
    if (!requirement || requirement.teamId !== params.teamId) {
      return NextResponse.json(
        { error: 'Requirement not found' },
        { status: 404 }
      );
    }

    // Update requirement status
    const updatedRequirement = await prisma.teamRequirement.update({
      where: { id: requirementId },
      data: { isActive },
    });

    return NextResponse.json({
      message: isActive ? 'Requirement activated' : 'Requirement marked as filled',
      data: updatedRequirement,
    });
  } catch (error) {
    console.error('Update requirement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}