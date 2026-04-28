import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

type AttendanceAction = 'CHECK_IN' | 'BREAKFAST' | 'LUNCH' | 'SWAG' | 'EVENT';
type QrPayload = { userId?: string; hackathonId?: string; type?: string };

const resolveUserFromQr = (
  qrToken: string | undefined,
  userId: string | undefined,
  hackathonId: string
) => {
  if (userId) {
    return { userId, hackathonId };
  }

  if (!qrToken) {
    return { userId: null, hackathonId: null };
  }

  if (qrToken.includes(':')) {
    const parts = qrToken.trim().split(':');
    const qrUserId = parts[0];
    const qrHackathonId = parts[1];
    if (qrHackathonId && qrHackathonId !== hackathonId) {
      return { userId: null, hackathonId: qrHackathonId };
    }
    return { userId: qrUserId, hackathonId: hackathonId };
  }

  const secret = process.env.QR_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return { userId: null, hackathonId: null };
  }

  try {
    const decoded = jwt.verify(qrToken, secret) as QrPayload;
    if (!decoded?.userId || !decoded?.hackathonId) {
      return { userId: null, hackathonId: null };
    }
    if (decoded.hackathonId !== hackathonId) {
      return { userId: null, hackathonId: decoded.hackathonId };
    }
    return { userId: decoded.userId, hackathonId: decoded.hackathonId };
  } catch {
    return { userId: null, hackathonId: null };
  }
};

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
    const { userId, action, eventId, qrToken } = body as {
      userId?: string;
      action?: AttendanceAction;
      eventId?: string;
      qrToken?: string;
    };

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    const resolved = resolveUserFromQr(qrToken, userId, params.hackathonId);
    if (!resolved.userId) {
      if (resolved.hackathonId && resolved.hackathonId !== params.hackathonId) {
        return NextResponse.json({ error: 'QR code is for a different hackathon' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }

    const resolvedUserId = resolved.userId;

    const user = await prisma.user.findUnique({ where: { id: resolvedUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'EVENT') {
      if (!eventId) {
        return NextResponse.json({ error: 'eventId required' }, { status: 400 });
      }

      const existing = await prisma.attendance.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId: params.hackathonId,
            userId: resolvedUserId,
          },
        },
      });

      const marks = (existing?.eventMarks as Record<string, string> | null) || {};
      if (marks[eventId]) {
        return NextResponse.json({
          message: 'Already recorded',
          data: existing,
          user: { id: user.id, name: user.name, email: user.email },
          alreadyDone: true,
        });
      }

      const nextMarks = { ...marks, [eventId]: new Date().toISOString() };
      const attendance = existing
        ? await prisma.attendance.update({
            where: { id: existing.id },
            data: { eventMarks: nextMarks },
          })
        : await prisma.attendance.create({
            data: {
              hackathonId: params.hackathonId,
              userId: resolvedUserId,
              eventMarks: nextMarks,
            },
          });

      return NextResponse.json({
        message: 'EVENT recorded',
        data: attendance,
        user: { id: user.id, name: user.name, email: user.email },
        alreadyDone: false,
      });
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
          userId: resolvedUserId,
        },
      },
      update: updateData,
      create: {
        hackathonId: params.hackathonId,
        userId: resolvedUserId,
        checkInTime: action === 'CHECK_IN' ? new Date() : null,
        breakfastRedeemed: action === 'BREAKFAST',
        lunchRedeemed: action === 'LUNCH',
        swagCollected: action === 'SWAG',
      },
    });

    return NextResponse.json({
      message: `${action.replace('_', ' ')} recorded for ${user.name || user.email}`,
      data: attendance,
      user: { id: user.id, name: user.name, email: user.email },
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

    // Only the hackathon organizer may view attendance records
    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
