import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/api-auth';
import { scoreSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function POST(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (currentUser.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Only judges can score submissions' }, { status: 403 });
    }

    // Fetch submission with hackathon status and judges list
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
      include: {
        hackathon: {
          select: {
            id: true,
            status: true,
            judges: { select: { id: true } },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Only allow scoring during ONGOING phase
    if (submission.hackathon?.status !== 'ONGOING') {
      return NextResponse.json(
        { error: 'Scoring is only allowed during the ONGOING phase' },
        { status: 400 }
      );
    }

    // Verify this judge is assigned to the hackathon's judging panel
    const isAssigned = submission.hackathon.judges.some((j) => j.id === currentUser.id);
    if (!isAssigned) {
      return NextResponse.json(
        { error: 'You are not assigned as a judge for this hackathon' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rubricItemId, ...scoreData } = body;
    const validatedData = scoreSchema.parse(scoreData);

    // Validate score does not exceed rubric item max
    const rubricItem = await prisma.rubricItem.findUnique({
      where: { id: rubricItemId },
    });
    if (!rubricItem) {
      return NextResponse.json({ error: 'Rubric item not found' }, { status: 404 });
    }
    if (validatedData.score > rubricItem.maxScore) {
      return NextResponse.json(
        { error: `Score cannot exceed maximum of ${rubricItem.maxScore}` },
        { status: 400 }
      );
    }

    // Create or update score
    const { submissionId: _sid, ...scoreCreate } = validatedData as any;
    const score = await prisma.score.upsert({
      where: {
        submissionId_rubricItemId_judgerId: {
          submissionId: params.submissionId,
          rubricItemId,
          judgerId: currentUser.id,
        },
      },
      create: {
        ...scoreCreate,
        submissionId: params.submissionId,
        rubricItemId,
        judgerId: currentUser.id,
      },
      update: validatedData,
      include: {
        rubricItem: true,
        judge: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: 'Score saved successfully', data: score },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      );
    }

    console.error('Create score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const currentUser = await getAuthUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only judges and organizers may view scores
    if (currentUser.role !== 'JUDGE' && currentUser.role !== 'ORGANISER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const scores = await prisma.score.findMany({
      where: { submissionId: params.submissionId },
      include: {
        rubricItem: true,
        judge: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: scores });
  } catch (error) {
    console.error('Get scores error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
