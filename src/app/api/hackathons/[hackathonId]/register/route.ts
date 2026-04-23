import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
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

    const attendance = await prisma.attendance.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ data: { registered: !!attendance } });
  } catch (error) {
    console.error('Registration status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  _req: Request,
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
    if (user.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Only participants can register' }, { status: 403 });
    }

    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    if (hackathon.status === 'DRAFT') {
      return NextResponse.json({ error: 'Registration is not yet open' }, { status: 400 });
    }

    if (hackathon.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This hackathon has been cancelled' }, { status: 400 });
    }

    if (hackathon.status === 'ENDED') {
      return NextResponse.json({ error: 'Registration is closed' }, { status: 400 });
    }

    const registrationDeadline = new Date(hackathon.registrationDeadline).getTime();
    if (Date.now() > registrationDeadline) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    await prisma.attendance.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
      create: {
        hackathonId: params.hackathonId,
        userId: user.id,
        checkInTime: new Date(),
      },
      update: {
        checkInTime: new Date(),
      },
    });

    return NextResponse.json({ message: 'Registered successfully' });
  } catch (error) {
    console.error('Register hackathon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
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
    if (user.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Only participants can unregister' }, { status: 403 });
    }

    await prisma.attendance.delete({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
    });

    await prisma.hackathonRegistration.deleteMany({
      where: {
        hackathonId: params.hackathonId,
        userId: user.id,
      },
    });

    return NextResponse.json({ message: 'Unregistered successfully' });
  } catch (error) {
    if ((error as { code?: string })?.code === 'P2025') {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }
    console.error('Unregister hackathon error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

