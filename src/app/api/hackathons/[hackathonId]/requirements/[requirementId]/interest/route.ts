import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
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
      include: { team: true },
    });
    if (!requirement || requirement.team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Cannot express interest in own team's requirement
    const isTeamMember = await prisma.teamMember.findFirst({
      where: {
        teamId: requirement.teamId,
        userId: user.id,
      },
    });
    if (isTeamMember) {
      return NextResponse.json(
        { error: 'You cannot express interest in your own team' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { message } = body;

    // Check if already expressed interest
    const existingInterest = await prisma.requirementInterest.findUnique({
      where: {
        requirementId_userId: {
          requirementId: params.requirementId,
          userId: user.id,
        },
      },
    });

    if (existingInterest) {
      // Update message if provided
      if (message !== undefined) {
        await prisma.requirementInterest.update({
          where: { id: existingInterest.id },
          data: { message: message?.trim() || null },
        });
      }
      return NextResponse.json({
        message: 'Interest already expressed',
        data: existingInterest,
      });
    }

    const interest = await prisma.requirementInterest.create({
      data: {
        requirementId: params.requirementId,
        userId: user.id,
        message: message?.trim() || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      { message: 'Interest expressed successfully', data: interest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Express interest error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      include: { team: true },
    });
    if (!requirement || requirement.team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Only team leader can see interests
    const isLeader = await prisma.teamMember.findFirst({
      where: {
        teamId: requirement.teamId,
        userId: user.id,
        role: 'leader',
      },
    });
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only team leaders can view interests' },
        { status: 403 }
      );
    }

    const interests = await prisma.requirementInterest.findMany({
      where: { requirementId: params.requirementId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                bio: true,
                skills: true,
                experience: true,
                company: true,
                githubUrl: true,
                linkedinUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: interests });
  } catch (error) {
    console.error('Get requirement interests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      include: { team: true },
    });
    if (!requirement || requirement.team.hackathonId !== params.hackathonId) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // Only team leader can update interest status
    const isLeader = await prisma.teamMember.findFirst({
      where: {
        teamId: requirement.teamId,
        userId: user.id,
        role: 'leader',
      },
    });
    if (!isLeader) {
      return NextResponse.json(
        { error: 'Only team leaders can update interest status' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { interestId, status } = body;

    if (!interestId || !status) {
      return NextResponse.json(
        { error: 'interestId and status are required' },
        { status: 400 }
      );
    }

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be ACCEPTED or REJECTED' },
        { status: 400 }
      );
    }

    const interest = await prisma.requirementInterest.findUnique({
      where: { id: interestId },
    });
    if (!interest || interest.requirementId !== params.requirementId) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 });
    }

    const updatedInterest = await prisma.requirementInterest.update({
      where: { id: interestId },
      data: { 
        status,
        respondedAt: status === 'ACCEPTED' || status === 'REJECTED' ? new Date() : null,
      },
    });

    // If accepted, directly add the user to the team
    if (status === 'ACCEPTED') {
      // Check if team exists and get team details
      const team = await prisma.team.findUnique({
        where: { id: requirement.teamId },
      });

      if (!team) {
        return NextResponse.json(
          { error: 'Team not found' },
          { status: 404 }
        );
      }

      // Check if team has space
      const memberCount = await prisma.teamMember.count({
        where: { teamId: requirement.teamId },
      });
      if (memberCount >= team.maxMembers) {
        return NextResponse.json(
          { error: 'Team is already full' },
          { status: 400 }
        );
      }

      // Check if user is already in a team for this hackathon
      const existingTeam = await prisma.teamMember.findFirst({
        where: {
          userId: interest.userId,
          team: { hackathonId: requirement.team.hackathonId },
        },
      });
      if (existingTeam) {
        return NextResponse.json(
          { error: 'User already in a team for this hackathon' },
          { status: 400 }
        );
      }

      // Check if user is registered for this hackathon
      const attendance = await prisma.attendance.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId: requirement.team.hackathonId,
            userId: interest.userId,
          },
        },
      });
      if (!attendance) {
        return NextResponse.json(
          { error: 'User is not registered for this hackathon' },
          { status: 400 }
        );
      }

      // Add user to team as a member
      await prisma.teamMember.create({
        data: {
          teamId: requirement.teamId,
          userId: interest.userId,
          role: 'member',
        },
      });

      // Optionally, mark the requirement as inactive if it's now fulfilled
      // Check if there are other accepted interests for this requirement
      const acceptedInterestsCount = await prisma.requirementInterest.count({
        where: {
          requirementId: params.requirementId,
          status: 'ACCEPTED',
        },
      });

      // If this is the first accepted interest, you might want to mark requirement as inactive
      // For now, we'll leave it active so multiple people can express interest
      // await prisma.teamRequirement.update({
      //   where: { id: params.requirementId },
      //   data: { isActive: false },
      // });
    }

    return NextResponse.json({
      message: status === 'ACCEPTED' 
        ? 'Interest accepted and user added to team' 
        : `Interest ${status.toLowerCase()}`,
      data: updatedInterest,
    });
  } catch (error) {
    console.error('Update interest status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}