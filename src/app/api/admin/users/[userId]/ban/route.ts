import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const user = await prisma.user.update({
    where: { id: params.userId },
    data: { isBanned: true, bannedAt: new Date() },
    select: { id: true, name: true, email: true, isBanned: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: auth.id,
      action: 'USER_BANNED',
      targetType: 'USER',
      targetId: params.userId,
      details: { targetName: user.name, targetEmail: user.email },
    },
  });

  return NextResponse.json(user);
}
