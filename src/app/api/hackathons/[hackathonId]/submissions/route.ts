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

    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        team: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

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

    return NextResponse.json({ data: parsedSubmissions });
  } catch (error) {
    console.error('Submission monitoring error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

