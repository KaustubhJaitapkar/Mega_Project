import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { hackathonCreateSchema } from '@/lib/validation';
import { ZodError } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json(
        { error: 'Invalid page value. It must be a positive integer.' },
        { status: 400 }
      );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit value. It must be between 1 and 100.' },
        { status: 400 }
      );
    }

    const where: any = {};
    if (status) {
      const validStatuses = ['DRAFT', 'REGISTRATION', 'ONGOING', 'ENDED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value.' },
          { status: 400 }
        );
      }
      where.status = status;
    }

    let organiserId: string | null = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      if (user?.role === 'ORGANISER') {
        organiserId = user.id;
      }
    }

    const publishedWhere = { status: { in: ['REGISTRATION', 'ONGOING', 'ENDED'] as Prisma.EnumHackathonStatusFilter<'Hackathon'>['in'] } };
    const visibilityWhere = organiserId
      ? { OR: [publishedWhere, { organiserId }] }
      : publishedWhere;

    const finalWhere = Object.keys(where).length
      ? { AND: [where, visibilityWhere] }
      : visibilityWhere;

    const hackathons = await prisma.hackathon.findMany({
      where: finalWhere,
      include: {
        organiser: { select: { id: true, name: true, email: true } },
        _count: {
          select: { teams: true, submissions: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.hackathon.count({ where: finalWhere });

    return NextResponse.json({
      data: hackathons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get hackathons error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    if (!user || user.role !== 'ORGANISER') {
      return NextResponse.json(
        { error: 'Only organisers can create hackathons' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = hackathonCreateSchema.parse(body);

    const {
      organiserId: _ignore,
      title,
      description,
      shortDescription,
      tagline,
      startDate,
      endDate,
      registrationDeadline,
      submissionDeadline,
      maxTeamSize,
      minTeamSize,
      location,
      isVirtual,
      prize,
      rules,
      bannerUrl,
      logoUrl,
      contactEmail,
      hostName,
      theme,
      eligibilityDomain,
      breakfastProvided,
      lunchProvided,
      dinnerProvided,
      swagProvided,
      sponsorDetails,
      judgeDetails,
      mentorDetails,
      themedTracks,
      targetBatches,
      allowedDepartments,
      allowCrossYearTeams,
      submissionRequirements,
      mealSchedule,
      rubricItems,
      internalMentors,
      venue,
    } = validatedData as any;

    const optionalString = (value?: string) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    };
    const resolvedLocation = optionalString(venue || location);

    const hackathon = await prisma.hackathon.create({
      data: {
        title,
        description,
        shortDescription,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        registrationDeadline: new Date(registrationDeadline),
        submissionDeadline: new Date(submissionDeadline),
        maxTeamSize,
        minTeamSize,
        isVirtual,
        sponsorIds: [],
        organiserId: user.id,
        ...(optionalString(tagline) && { tagline: optionalString(tagline) }),
        ...(resolvedLocation && { location: resolvedLocation }),
        ...(optionalString(prize) && { prize: optionalString(prize) }),
        ...(optionalString(rules) && { rules: optionalString(rules) }),
        ...(optionalString(bannerUrl) && { bannerUrl: optionalString(bannerUrl) }),
        ...(optionalString(logoUrl) && { logoUrl: optionalString(logoUrl) }),
        ...(optionalString(contactEmail) && { contactEmail: optionalString(contactEmail) }),
        ...(optionalString(hostName) && { hostName: optionalString(hostName) }),
        ...(optionalString(theme) && { theme: optionalString(theme) }),
        ...(optionalString(eligibilityDomain) && { eligibilityDomain: optionalString(eligibilityDomain) }),
        breakfastProvided,
        lunchProvided,
        dinnerProvided,
        swagProvided,
        themedTracks,
        targetBatches,
        allowedDepartments,
        allowCrossYearTeams,
        submissionRequirements,
        ...(Array.isArray(sponsorDetails) && sponsorDetails.length > 0 && { sponsorDetails }),
        ...(Array.isArray(judgeDetails) && judgeDetails.length > 0 && { judgeDetails }),
        ...(Array.isArray(mentorDetails) && mentorDetails.length > 0 && { mentorDetails }),
        ...(Array.isArray(mealSchedule) && mealSchedule.length > 0 && { mealSchedule }),
        ...(Array.isArray(rubricItems) && rubricItems.length > 0 && { rubricItems }),
        ...(Array.isArray(internalMentors) && internalMentors.length > 0 && { internalMentors }),
      },
      include: {
        organiser: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'Hackathon created successfully',
        data: hackathon,
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

    console.error('Create hackathon error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && error instanceof Error
          ? { detail: error.message }
          : {}),
      },
      { status: 500 }
    );
  }
}
