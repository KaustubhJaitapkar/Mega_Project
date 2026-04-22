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

    const query = new URL(req.url).searchParams.get('q') || '';
    const term = query.toLowerCase();

    const registrations = await prisma.hackathonRegistration.findMany({
      where: {
        hackathonId: params.hackathonId,
        user: {
          role: 'PARTICIPANT',
          teamMembers: {
            none: { team: { hackathonId: params.hackathonId } },
          },
        },
      },
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
    });

    const filtered = registrations.filter((r) => {
      if (!term) return true;
      return (
        r.firstName.toLowerCase().includes(term) ||
        (r.lastName || '').toLowerCase().includes(term) ||
        r.instituteName.toLowerCase().includes(term) ||
        r.domain.toLowerCase().includes(term) ||
        r.courseSpecialization.toLowerCase().includes(term) ||
        r.user.email.toLowerCase().includes(term)
      );
    });

    return NextResponse.json({
      data: filtered.map((r) => ({
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
    });
  } catch (error) {
    console.error('List participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
