import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeHackathonMeta, parseHackathonMeta } from '@/lib/hackathonMeta';

export async function GET(
  _req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: {
        teams: { select: { id: true, name: true } },
      },
    });
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }
    const meta = parseHackathonMeta(hackathon.rules);
    return NextResponse.json({
      data: {
        judgingOpen: !!meta.judgingOpen,
        blindMode: !!meta.blindMode,
        anonymousMap: meta.anonymousMap || {},
      },
    });
  } catch (error) {
    console.error('Get judging control error:', error);
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
    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
      include: { teams: true },
    });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const meta = parseHackathonMeta(hackathon.rules);

    if (typeof body.judgingOpen === 'boolean') {
      meta.judgingOpen = body.judgingOpen;
    }
    if (typeof body.blindMode === 'boolean') {
      meta.blindMode = body.blindMode;
      if (body.blindMode) {
        meta.anonymousMap = {};
        hackathon.teams.forEach((team, idx) => {
          meta.anonymousMap![team.id] = `Team-${String(idx + 1).padStart(3, '0')}`;
        });
      }
    }

    const updated = await prisma.hackathon.update({
      where: { id: params.hackathonId },
      data: { rules: mergeHackathonMeta(hackathon.rules, meta) },
    });

    return NextResponse.json({ message: 'Judging control updated', data: updated });
  } catch (error) {
    console.error('Judging control update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

