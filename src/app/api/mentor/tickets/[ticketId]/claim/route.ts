import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  _req: Request,
  { params }: { params: { ticketId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const mentor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!mentor || mentor.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.helpTicket.findUnique({ where: { id: params.ticketId } });
      if (!ticket) {
        return { error: 'Ticket not found', status: 404 as const };
      }
      if (ticket.status !== 'OPEN') {
        return { error: 'Ticket already claimed/resolved', status: 400 as const };
      }

      const membership = await tx.teamMember.findFirst({
        where: {
          userId: ticket.creatorId,
          team: {
            hackathonId: ticket.hackathonId,
          },
        },
        select: {
          teamId: true,
        },
      });

      const updated = await tx.helpTicket.update({
        where: { id: params.ticketId },
        data: { status: 'IN_PROGRESS', assignedToId: mentor.id },
      });

      if (membership?.teamId) {
        await tx.teamMentor.upsert({
          where: {
            teamId_mentorId: {
              teamId: membership.teamId,
              mentorId: mentor.id,
            },
          },
          update: {},
          create: {
            teamId: membership.teamId,
            mentorId: mentor.id,
          },
        });
      }

      return { data: updated };
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: 'Ticket claimed', data: result.data });
  } catch (error) {
    console.error('Claim ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
