import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { announcementCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { emitAnnouncement } from '@/lib/socket';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const skip = (page - 1) * limit;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: { hackathonId: params.hackathonId },
        include: {
          author: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.announcement.count({
        where: { hackathonId: params.hackathonId },
      }),
    ]);

    return NextResponse.json({
      data: announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get announcements error:', error);
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

    // Check if user is organiser or mentor
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: {
        organiser: true,
        judges: true,
        mentors: true,
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    const isAuthorized =
      hackathon.organiserId === user.id ||
      hackathon.mentors.some((m) => m.id === user.id) ||
      user.role === 'ORGANISER';

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = announcementCreateSchema.parse(body);
    const channel = body.channel || 'website';

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        isUrgent: validatedData.isUrgent ?? false,
        content: `[channel:${channel}] ${validatedData.content}`,
        hackathon: { connect: { id: params.hackathonId } },
        author: { connect: { id: user.id } },
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    // Emit socket event
    emitAnnouncement(params.hackathonId, {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      author: announcement.author,
      isUrgent: announcement.isUrgent,
    });

    return NextResponse.json(
      {
        message: 'Announcement created successfully',
        data: announcement,
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

    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
