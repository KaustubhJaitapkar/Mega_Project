import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireOrganizerOf, isErrorResponse } from '@/lib/api-auth';

export async function GET(
  req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - No session', code: 'NO_SESSION' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, role: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - User not found', code: 'USER_NOT_FOUND' }, { status: 401 });
    }

    if (user.role !== 'ORGANISER') {
      return NextResponse.json({ 
        error: 'Forbidden - User is not an organiser', 
        code: 'NOT_ORGANISER',
        userRole: user.role 
      }, { status: 403 });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      select: { organiserId: true },
    });
    
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found', code: 'HACKATHON_NOT_FOUND' }, { status: 404 });
    }

    if (hackathon.organiserId !== user.id) {
      return NextResponse.json({ 
        error: 'Forbidden - User is not the organiser of this hackathon', 
        code: 'NOT_HACKATHON_ORGANISER',
        userId: user.id,
        organiserId: hackathon.organiserId
      }, { status: 403 });
    }

    const q = new URL(req.url).searchParams.get('q') || '';
    const hackathonData = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: {
        judges: { select: { id: true, name: true, email: true, role: true } },
        mentors: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (!hackathonData) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    let candidates: any[] = [];
    if (q) {
      candidates = await prisma.user.findMany({
        where: {
          email: { contains: q.slice(0, 100), mode: 'insensitive' },
        },
        select: { id: true, name: true, email: true, role: true },
        take: 10,
      });
    }

    return NextResponse.json({
      data: {
        judges: hackathonData.judges,
        mentors: hackathonData.mentors,
        candidates,
      },
    });
  } catch (error) {
    console.error('Staff lookup error:', error);
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
    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, type } = await req.json();
    if (!email || !['JUDGE', 'MENTOR'].includes(type)) {
      return NextResponse.json({ error: 'email and valid type required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
    }

    if (type === 'JUDGE' && user.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Role mismatch: user is not a judge' }, { status: 400 });
    }
    if (type === 'MENTOR' && user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Role mismatch: user is not a mentor' }, { status: 400 });
    }

    const updated = await prisma.hackathon.update({
      where: { id: params.hackathonId },
      data:
        type === 'JUDGE'
          ? { judges: { connect: { id: user.id } } }
          : { mentors: { connect: { id: user.id } } },
      include: {
        judges: { select: { id: true, name: true, email: true, role: true } },
        mentors: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({
      message: `${type.toLowerCase()} added`,
      data: { judges: updated.judges, mentors: updated.mentors },
    });
  } catch (error) {
    console.error('Add staff error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

