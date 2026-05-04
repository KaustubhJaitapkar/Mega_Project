import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [actor, hackathon] = await Promise.all([
      prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }),
      prisma.hackathon.findUnique({ where: { id: params.hackathonId }, select: { organiserId: true } }),
    ]);
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(_req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { hackathonId: params.hackathonId },
        select: {
          id: true,
          status: true,
          isHealthy: true,
          submittedAt: true,
          githubUrl: true,
          liveUrl: true,
          technologies: true,
          pitchDeckUrl: true,
          description: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              members: {
                select: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where: { hackathonId: params.hackathonId } }),
    ]);

    // Parse files from pitchDeckUrl for each submission
    const parsedSubmissions = submissions.map((submission: any) => {
      if (submission.pitchDeckUrl) {
        try {
          const files = JSON.parse(submission.pitchDeckUrl);
          return {
            ...submission,
            pitchDeckUrl: undefined,
            files,
          };
        } catch (e) {
          return submission;
        }
      }
      return submission;
    });

    return NextResponse.json({
      data: parsedSubmissions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Submission monitoring error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

