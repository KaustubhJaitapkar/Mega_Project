import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_ROLES = ['PARTICIPANT', 'ORGANISER', 'JUDGE', 'MENTOR', 'SPONSOR'] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only organisers can enumerate users
    const requestingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (!requestingUser || requestingUser.role !== 'ORGANISER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const q = searchParams.get('q')?.trim();
    const limitParam = Number.parseInt(searchParams.get('limit') || '25', 10);
    const take = Number.isNaN(limitParam) ? 25 : Math.min(Math.max(limitParam, 1), 50);

    if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json({ error: 'Invalid role filter' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as (typeof VALID_ROLES)[number] } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        profile: {
          select: {
            skills: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      take,
    });

    return NextResponse.json({
      data: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        expertise: user.profile?.skills?.join(', ') || '',
      })),
    });
  } catch (error) {
    console.error('List users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
