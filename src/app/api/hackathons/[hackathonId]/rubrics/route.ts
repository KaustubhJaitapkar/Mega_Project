import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rubricCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const rubrics = await prisma.rubric.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json({ data: rubrics });
  } catch (error) {
    console.error('Get rubrics error:', error);
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

    // Check if user is organiser
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
    });

    if (!hackathon || hackathon.organiserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { items, ...rubricData } = body;
    rubricCreateSchema.parse(body);

    const rubric = await prisma.rubric.create({
      data: {
        ...rubricData,
        hackathonId: params.hackathonId,
        items: {
          create: items.map((item: any, index: number) => ({
            ...item,
            order: index,
          })),
        },
      },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(
      {
        message: 'Rubric created successfully',
        data: rubric,
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

    console.error('Create rubric error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
