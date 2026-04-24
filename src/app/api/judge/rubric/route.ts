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
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hackathonId = new URL(req.url).searchParams.get('hackathonId');
    if (!hackathonId) {
      return NextResponse.json({ error: 'hackathonId is required' }, { status: 400 });
    }

    const rubrics = await prisma.rubric.findMany({
      where: { hackathonId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    const rubric = rubrics[0];
    return NextResponse.json({ 
      data: {
        items: rubric?.items || []
      }
    });
  } catch (error) {
    console.error('Judge rubric error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

