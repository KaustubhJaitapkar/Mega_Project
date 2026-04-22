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
    const sponsor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!sponsor || sponsor.role !== 'SPONSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const skill = url.searchParams.get('skill') || '';
    const college = url.searchParams.get('college') || '';
    const experience = url.searchParams.get('experience') || '';

    const participants = await prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
        profile: {
          isPublic: true,
          ...(college ? { company: { contains: college, mode: 'insensitive' } } : {}),
          ...(experience ? { experience } : {}),
          ...(skill ? { skills: { has: skill } } : {}),
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        githubUsername: true,
        profile: {
          select: {
            skills: true,
            bio: true,
            company: true,
            experience: true,
            isPublic: true,
          },
        },
      },
      take: 100,
    });

    return NextResponse.json({ data: participants });
  } catch (error) {
    console.error('Sponsor participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

