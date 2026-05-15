import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const hackathon = await prisma.hackathon.update({
    where: { id: params.hackathonId },
    data: { isPaused: false, pausedAt: null, pauseReason: null },
    select: { id: true, title: true, isPaused: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.id,
      action: 'HACKATHON_RESUMED',
      targetType: 'HACKATHON',
      targetId: params.hackathonId,
      details: { title: hackathon.title },
    },
  });

  return NextResponse.json(hackathon);
}
