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

    const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const hackathonId = url.searchParams.get('hackathonId');
    if (!hackathonId) {
      return NextResponse.json({ error: 'hackathonId is required' }, { status: 400 });
    }

    // Verify mentor is assigned to this hackathon
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        mentors: { some: { id: mentor.id } },
      },
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'You are not assigned to this hackathon' }, { status: 403 });
    }

    const assignments = await prisma.teamMentor.findMany({
      where: {
        mentorId: mentor.id,
        team: { hackathonId },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
            hackathon: { select: { id: true, title: true } }
          }
        }
      }
    });

    return NextResponse.json({
      data: assignments.map((assignment) => ({
        team: assignment.team,
        assignedAt: assignment.assignedAt
      }))
    });
  } catch (error) {
    console.error('Mentor assigned teams error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
