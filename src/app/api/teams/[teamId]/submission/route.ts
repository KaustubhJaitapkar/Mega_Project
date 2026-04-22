import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { submissionSchema } from '@/lib/validation';
import { validateSubmission } from '@/lib/submission';
import { ZodError } from 'zod';

export async function GET(
  _req: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { teamId: params.teamId },
      include: {
        team: true,
      },
    });

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('Get team submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.teamId,
          userId: user.id,
        },
      },
      include: {
        team: {
          include: {
            hackathon: true,
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Not a team member' }, { status: 403 });
    }

    if (new Date() > new Date(teamMember.team.hackathon.submissionDeadline)) {
      return NextResponse.json({ error: 'Submission deadline passed' }, { status: 400 });
    }

    const body = await req.json();
    const validatedData = submissionSchema.parse(body);

    const health = await validateSubmission(validatedData.githubUrl, validatedData.liveUrl);
    const isHealthy = health.valid;

    const submission = await prisma.submission.upsert({
      where: { teamId: params.teamId },
      create: {
        teamId: params.teamId,
        hackathonId: teamMember.team.hackathonId,
        ...validatedData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        isHealthy,
        healthCheckAt: new Date(),
      },
      update: {
        ...validatedData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        isHealthy,
        healthCheckAt: new Date(),
      },
    });

    return NextResponse.json({
      data: submission,
      healthStatus: isHealthy ? 'healthy' : 'broken',
      issues: health.errors,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      );
    }
    console.error('Upsert team submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
