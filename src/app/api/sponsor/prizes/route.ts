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

    const { hackathonId, userId, type, title, description } = await req.json();
    if (!hackathonId || !userId || !type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cert = await prisma.certificate.create({
      data: {
        hackathonId,
        userId,
        type,
        title: `[SPONSOR PRIZE] ${title}`,
        description: description || '',
      },
    });

    return NextResponse.json({ message: 'Prize assigned', data: cert });
  } catch (error) {
    console.error('Sponsor prize error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

