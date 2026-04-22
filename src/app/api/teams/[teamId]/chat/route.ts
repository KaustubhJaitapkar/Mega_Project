import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        members: { select: { userId: true } },
        teamMentors: {
          include: { mentor: { select: { id: true, name: true, email: true, image: true } } },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isMember = team.members.some((m) => m.userId === user.id);
    const isMentor = team.teamMentors.some((m) => m.mentorId === user.id);
    if (!isMember && !isMentor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { teamId: params.teamId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, image: true } },
        mentor: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({
      data: {
        team: { id: team.id, name: team.name, hackathonId: team.hackathonId },
        mentors: team.teamMentors.map((m) => m.mentor),
        messages,
      },
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        members: { select: { userId: true } },
        teamMentors: { select: { mentorId: true } },
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const isMember = team.members.some((m) => m.userId === user.id);
    const isMentor = team.teamMentors.some((m) => m.mentorId === user.id);
    if (!isMember && !isMentor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const content = (body?.content || '').trim();
    if (!content) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        hackathonId: team.hackathonId,
        teamId: team.id,
        content,
        isFromMentor: isMentor,
        mentorId: isMentor ? user.id : null,
        userId: isMentor ? null : user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        mentor: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ data: message });
  } catch (error) {
    console.error('Post chat message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
