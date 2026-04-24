import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mergeHackathonMeta, parseHackathonMeta } from '@/lib/hackathonMeta';

export async function GET(
  _req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: {
        organiser: { select: { id: true, name: true, email: true, image: true } },
        judges: { select: { id: true, name: true, email: true, image: true } },
        mentors: { select: { id: true, name: true, email: true, image: true } },
        teams: {
          include: {
            members: { include: { user: { select: { id: true, name: true, image: true } } } },
            submission: true,
          },
        },
        timelines: { orderBy: { startTime: 'asc' } },
        _count: {
          select: { teams: true, submissions: true, attendances: true },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: hackathon });
  } catch (error) {
    console.error('Get hackathon error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: { organiser: true },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || hackathon.organiserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const meta = parseHackathonMeta(hackathon.rules);
    if (typeof body.maxTeams === 'number') {
      meta.maxTeams = body.maxTeams;
    }

    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      published: 'REGISTRATION',
      ongoing: 'ONGOING',
      judging: 'ONGOING',
      ended: 'ENDED',
    };
    if (typeof body.status === 'string') {
      const mapped = statusMap[body.status.toLowerCase()];
      if (mapped) {
        body.status = mapped;
      }
    }

    body.rules = mergeHackathonMeta(body.rules ?? hackathon.rules, meta);

    // Whitelist only fields that exist in the Prisma schema
    const ALLOWED_FIELDS = new Set([
      'title', 'tagline', 'description', 'shortDescription',
      'bannerUrl', 'logoUrl', 'status', 'startDate', 'endDate',
      'registrationDeadline', 'submissionDeadline', 'maxTeamSize',
      'minTeamSize', 'location', 'isVirtual', 'prize', 'rules',
      'contactEmail', 'hostName', 'theme', 'eligibilityDomain',
      'breakfastProvided', 'lunchProvided', 'dinnerProvided', 'swagProvided',
      'sponsorDetails', 'judgeDetails', 'mentorDetails',
      'themedTracks', 'targetBatches', 'allowedDepartments',
      'allowCrossYearTeams', 'submissionRequirements',
      'mealSchedule', 'rubricItems', 'internalMentors',
    ]);
    const data = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED_FIELDS.has(k))
    );

    const updatedHackathon = await prisma.hackathon.update({
      where: { id: params.hackathonId },
      data,
    });

    return NextResponse.json({
      message: 'Hackathon updated successfully',
      data: updatedHackathon,
    });
  } catch (error) {
    console.error('Update hackathon error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || hackathon.organiserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.hackathon.delete({
      where: { id: params.hackathonId },
    });

    return NextResponse.json({
      message: 'Hackathon deleted successfully',
    });
  } catch (error) {
    console.error('Delete hackathon error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
