import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category') || undefined;
    const fromMinutes = parseInt(url.searchParams.get('fromMinutes') || '0', 10);
    const where: any = {};
    if (category) where.category = category;
    if (fromMinutes > 0) where.createdAt = { gte: new Date(Date.now() - fromMinutes * 60_000) };

    const tickets = await prisma.helpTicket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        hackathon: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('Mentor ticket queue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

