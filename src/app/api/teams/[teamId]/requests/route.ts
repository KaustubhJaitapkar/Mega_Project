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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const type = new URL(req.url).searchParams.get('type') || 'incoming';
    const team = await prisma.team.findUnique({ where: { id: params.teamId } });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (type === 'incoming') {
      if (team.creatorId !== user.id) {
        return NextResponse.json({ error: 'Only lead can view incoming requests' }, { status: 403 });
      }

      const requests = await prisma.joinRequest.findMany({
        where: { teamId: params.teamId, status: 'PENDING', requestedById: { not: user.id } },
        include: { team: true },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json({ data: requests });
    }

    const requests = await prisma.joinRequest.findMany({
      where: { requestedById: user.id, teamId: params.teamId, status: 'PENDING' },
      include: { team: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: requests });
  } catch (error) {
    console.error('List requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
