import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreSchema } from '@/lib/validation';
import { ZodError } from 'zod';

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

    if (!user || user.role !== 'JUDGE') {
      return NextResponse.json(
        { error: 'Only judges can score submissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { rubricItemId, ...scoreData } = body;
    const validatedData = scoreSchema.parse(scoreData);

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: params.submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Create or update score
    const { submissionId: _sid, ...scoreCreate } = validatedData as any;
    const score = await prisma.score.upsert({
      where: {
        submissionId_rubricItemId_judgerId: {
          submissionId: params.submissionId,
          rubricItemId,
          judgerId: user.id,
        },
      },
      create: {
        ...scoreCreate,
        submissionId: params.submissionId,
        rubricItemId,
        judgerId: user.id,
      },
      update: validatedData,
      include: {
        rubricItem: true,
        judge: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Score saved successfully',
        data: score,
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

    console.error('Create score error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
