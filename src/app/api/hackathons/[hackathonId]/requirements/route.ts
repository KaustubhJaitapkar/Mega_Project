import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all active requirements for teams in this hackathon
    const requirements = await prisma.teamRequirement.findMany({
      where: {
        isActive: true,
        team: {
          hackathonId: params.hackathonId,
        },
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { 
                    id: true, 
                    name: true, 
                    image: true,
                    profile: {
                      select: { 
                        skills: true,
                        experience: true,
                        company: true,
                        githubUrl: true,
                        linkedinUrl: true,
                        country: true,
                        bio: true
                      }
                    }
                  },
                },
              },
            },
            _count: {
              select: { members: true },
            },
          },
        },
        _count: {
          select: { interests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check if the current user has already expressed interest in each requirement
    const requirementIds = requirements.map((r) => r.id);
    const userInterests = await prisma.requirementInterest.findMany({
      where: {
        requirementId: { in: requirementIds },
        userId: user.id,
      },
      select: { requirementId: true, status: true },
    });

    const interestMap = new Map(
      userInterests.map((i) => [i.requirementId, i.status])
    );

    const requirementsWithInterest = requirements.map((req) => ({
      ...req,
      userInterestStatus: interestMap.get(req.id) || null,
    }));

    return NextResponse.json({ data: requirementsWithInterest });
  } catch (error) {
    console.error('Get hackathon requirements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}