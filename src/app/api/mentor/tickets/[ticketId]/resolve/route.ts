import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
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

    const { resolution } = await req.json();
    const ticket = await prisma.helpTicket.findUnique({ where: { id: params.ticketId } });
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    if (ticket.assignedToId !== mentor.id) {
      return NextResponse.json({ error: 'Only claimer can resolve ticket' }, { status: 403 });
    }

    // Verify mentor is assigned to this hackathon
    const hackathonMembership = await prisma.hackathon.findFirst({
      where: {
        id: ticket.hackathonId,
        mentors: { some: { id: mentor.id } },
      },
    });
    if (!hackathonMembership) {
      return NextResponse.json({ error: 'You are not assigned to this hackathon' }, { status: 403 });
    }

    const updated = await prisma.helpTicket.update({
      where: { id: params.ticketId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        description: resolution ? `${ticket.description}\n\n[Resolution]\n${resolution}` : ticket.description,
      },
    });

    return NextResponse.json({ message: 'Ticket resolved', data: updated });
  } catch (error) {
    console.error('Resolve ticket error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

