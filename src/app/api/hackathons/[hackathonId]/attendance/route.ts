import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type AttendanceAction = 'CHECK_IN' | 'BREAKFAST' | 'LUNCH' | 'SWAG';

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

    const body = await req.json();
    const { userId, action } = body as { userId: string; action: AttendanceAction };

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (action === 'CHECK_IN') {
      updateData.checkInTime = new Date();
    } else if (action === 'BREAKFAST') {
      updateData.breakfastRedeemed = true;
    } else if (action === 'LUNCH') {
      updateData.lunchRedeemed = true;
    } else if (action === 'SWAG') {
      updateData.swagCollected = true;
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId,
        },
      },
      update: updateData,
      create: {
        hackathonId: params.hackathonId,
        userId,
        checkInTime: action === 'CHECK_IN' ? new Date() : null,
        breakfastRedeemed: action === 'BREAKFAST',
        lunchRedeemed: action === 'LUNCH',
        swagCollected: action === 'SWAG',
      },
    });

    return NextResponse.json({
      message: `${action.replace('_', ' ')} recorded for ${user.name || user.email}`,
      data: attendance,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attendances = await prisma.attendance.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { checkInTime: 'desc' },
    });

    return NextResponse.json({ data: attendances });
  } catch (error) {
    console.error('Attendance fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
