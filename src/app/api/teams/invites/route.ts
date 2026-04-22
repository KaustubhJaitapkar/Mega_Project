import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invites = await prisma.joinRequest.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
        requestedById: { not: user.id },
      },
      include: {
        team: true,
        requestedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: invites });
  } catch (error) {
    console.error('List invites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
