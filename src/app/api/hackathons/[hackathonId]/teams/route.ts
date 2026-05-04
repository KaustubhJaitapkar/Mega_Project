import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { teamCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: { hackathonId: params.hackathonId },
        include: {
          creator: { select: { id: true, name: true, image: true } },
          members: {
            select: {
              id: true,
              teamId: true,
              userId: true,
              role: true,
              joinedAt: true,
              user: { select: { id: true, name: true, image: true, profile: { select: { skills: true, experience: true } } } },
            },
          },
          submission: {
            select: { id: true, status: true, isHealthy: true, submittedAt: true, githubUrl: true, liveUrl: true, technologies: true },
          },
          _count: {
            select: { joinRequests: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.team.count({ where: { hackathonId: params.hackathonId } }),
    ]);

    return NextResponse.json({
      data: teams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
        { error: 'Only participants can create teams' },
        { status: 403 }
      );
    }

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    const attendance = await prisma.attendance.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
    });
    if (!attendance) {
      return NextResponse.json(
        { error: 'Register for this hackathon before creating a team' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const validatedData = teamCreateSchema.parse(body);

    // Create team
    const { hackathonId: _ignore, ...teamData } = validatedData as any;
    const team = await prisma.team.create({
      data: {
        ...teamData,
        hackathonId: params.hackathonId,
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'leader',
          },
        },
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
        members: {
          select: {
            id: true,
            teamId: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Team created successfully',
        data: team,
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

    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
