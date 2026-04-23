import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await prisma.teamMentor.findMany({
      where: { mentorId: mentor.id },
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
