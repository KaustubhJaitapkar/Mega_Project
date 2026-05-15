import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await req.json();
  const reason = body.reason || 'Paused by platform administrator';

  const hackathon = await prisma.hackathon.update({
    where: { id: params.hackathonId },
    data: { isPaused: true, pausedAt: new Date(), pauseReason: reason },
    select: { id: true, title: true, isPaused: true, pausedAt: true, pauseReason: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.id,
      action: 'HACKATHON_PAUSED',
      targetType: 'HACKATHON',
      targetId: params.hackathonId,
      details: { title: hackathon.title, reason },
    },
  });

  return NextResponse.json(hackathon);
}
