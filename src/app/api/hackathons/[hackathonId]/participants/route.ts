import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = await prisma.team.findFirst({
      where: { hackathonId: params.hackathonId, creatorId: user.id },
      select: { id: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Only team leads can view participants' }, { status: 403 });
    }

    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').slice(0, 100);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    const whereClause = {
      hackathonId: params.hackathonId,
      user: {
        role: 'PARTICIPANT' as const,
        teamMembers: {
          none: { team: { hackathonId: params.hackathonId } },
        },
        ...(query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
          ],
        } : {}),
      },
    };

    const [registrations, total] = await Promise.all([
      prisma.hackathonRegistration.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.hackathonRegistration.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: registrations.map((r) => ({
        id: r.userId,
        name: r.user.name,
        email: r.user.email,
        image: r.user.image,
        instituteName: r.instituteName,
        domain: r.domain,
        course: r.course,
        courseSpecialization: r.courseSpecialization,
        graduatingYear: r.graduatingYear,
        skills: r.user.profile?.skills || [],
        experience: r.user.profile?.experience || '',
      })),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
