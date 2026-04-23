import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ticketCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';
import { emitTicketUpdate } from '@/lib/socket';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = { hackathonId: params.hackathonId };
    if (status) {
      where.status = status;
    }

    const tickets = await prisma.helpTicket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = ticketCreateSchema.parse(body);

    const { hackathonId: _ignore, ...ticketData } = validatedData as any;
    const ticket = await prisma.helpTicket.create({
      data: {
        ...ticketData,
        hackathonId: params.hackathonId,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Emit socket event
    emitTicketUpdate(params.hackathonId, {
      id: ticket.id,
      status: ticket.status,
      title: ticket.title,
      creator: ticket.creator,
    });

    return NextResponse.json(
      {
        message: 'Ticket created successfully',
        data: ticket,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      );
    }

    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
