import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      bannedAt: true,
      createdAt: true,
      updatedAt: true,
      image: true,
      githubUsername: true,
      profile: true,
      _count: {
        select: {
          teamMembers: true,
          registrations: true,
          hackathonsOrganised: true,
          scores: true,
          certificates: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const body = await req.json();
  const { role } = body;

  if (role) {
    const user = await prisma.user.update({
      where: { id: params.userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.id,
        action: 'USER_ROLE_CHANGED',
        targetType: 'USER',
        targetId: params.userId,
        details: { newRole: role, targetName: user.name },
      },
    });

    return NextResponse.json(user);
  }

  return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await prisma.user.delete({ where: { id: params.userId } });

  await prisma.auditLog.create({
    data: {
      userId: auth.id,
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: params.userId,
      details: { targetName: user.name, targetEmail: user.email },
    },
  });

  return NextResponse.json({ success: true });
}
