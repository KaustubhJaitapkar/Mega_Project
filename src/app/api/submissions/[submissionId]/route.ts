import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submissionSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { validateSubmission } from '@/lib/submission';

export async function GET(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        team: { include: { members: { include: { user: true } } } },
        scores: {
          include: {
            rubricItem: true,
            judge: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error('Get submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
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

    // Get submission and verify membership
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: { team: true },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check team membership
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: submission.teamId,
          userId: user.id,
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Not a team member' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = submissionSchema.parse(body);

    // Validate submission
    const validation = await validateSubmission(
      validatedData.githubUrl,
      validatedData.liveUrl
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', issues: validation.errors },
        { status: 400 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: params.submissionId },
      data: {
        ...validatedData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        isHealthy: validation.valid,
        healthCheckAt: new Date(),
      },
      include: {
        scores: {
          include: {
            rubricItem: true,
            judge: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Submission saved successfully',
        data: updatedSubmission,
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

    console.error('Create submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
