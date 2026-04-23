import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hackathonRegistrationSchema } from '@/lib/validation';
import { ZodError } from 'zod';

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

    const registration = await prisma.hackathonRegistration.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ data: registration });
  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    if (user.role !== 'PARTICIPANT') {
      return NextResponse.json({ error: 'Only participants can register' }, { status: 403 });
    }

    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    const registrationDeadline = new Date(hackathon.registrationDeadline).getTime();
    if (Date.now() > registrationDeadline) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    const body = await req.json();
    const validated = hackathonRegistrationSchema.parse({
      ...body,
      email: body?.email || user.email,
    });

    const registration = await prisma.hackathonRegistration.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
      create: {
        firstName: validated.firstName,
        lastName: validated.lastName || '',
        email: validated.email,
        phone: validated.phone,
        gender: validated.gender,
        location: validated.location,
        instituteName: validated.instituteName,
        differentlyAbled: validated.differentlyAbled ?? false,
        userType: validated.userType,
        domain: validated.domain,
        course: validated.course,
        courseSpecialization: validated.courseSpecialization,
        graduatingYear: validated.graduatingYear,
        courseDuration: validated.courseDuration,
        termsAccepted: validated.termsAccepted,
        hackathon: { connect: { id: params.hackathonId } },
        user: { connect: { id: user.id } },
      },
      update: {
        ...validated,
      },
    });

    await prisma.attendance.upsert({
      where: {
        hackathonId_userId: {
          hackathonId: params.hackathonId,
          userId: user.id,
        },
      },
      create: {
        hackathon: { connect: { id: params.hackathonId } },
        user: { connect: { id: user.id } },
        checkInTime: new Date(),
      },
      update: {
        checkInTime: new Date(),
      },
    });

    return NextResponse.json({ message: 'Registration saved', data: registration });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.errors }, { status: 400 });
    }
    console.error('Save registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
