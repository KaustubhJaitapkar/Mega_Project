import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sponsor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!sponsor || sponsor.role !== 'SPONSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hackathonId, title, content } = await req.json();
    if (!hackathonId || !title || !content) {
      return NextResponse.json({ error: 'hackathonId, title, content required' }, { status: 400 });
    }

    const record = await prisma.announcement.create({
      data: {
        hackathonId,
        authorId: sponsor.id,
        title: `[SPONSOR] ${title}`,
        content,
      },
    });
    return NextResponse.json({ message: 'Sponsor message broadcasted', data: record });
  } catch (error) {
    console.error('Sponsor message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

