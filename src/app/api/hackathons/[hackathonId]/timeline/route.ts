import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { timelineCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const items = await prisma.timeline.findMany({
      where: { hackathonId: params.hackathonId },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Get timeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!user || !hackathon || hackathon.organiserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = timelineCreateSchema.parse(body);
    const created = await prisma.timeline.create({
      data: {
        hackathonId: params.hackathonId,
        title: validated.title,
        description: validated.description,
        type: validated.type,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
      },
    });
    return NextResponse.json({ message: 'Timeline event created', data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.errors }, { status: 400 });
    }
    console.error('Create timeline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

