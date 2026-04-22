import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mergeHackathonMeta, parseHackathonMeta } from '@/lib/hackathonMeta';

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
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action as 'LOCK_SUBMISSIONS' | 'EXTEND_DEADLINE' | 'OPEN_JUDGING';
    const meta = parseHackathonMeta(hackathon.rules);

    const data: any = {};
    if (action === 'LOCK_SUBMISSIONS') {
      meta.lockSubmissions = true;
    }
    if (action === 'EXTEND_DEADLINE') {
      if (!body.submissionDeadline) {
        return NextResponse.json({ error: 'submissionDeadline required' }, { status: 400 });
      }
      data.submissionDeadline = new Date(body.submissionDeadline);
    }
    if (action === 'OPEN_JUDGING') {
      meta.judgingOpen = true;
      data.status = 'ONGOING';
    }
    data.rules = mergeHackathonMeta(hackathon.rules, meta);

    const updated = await prisma.hackathon.update({
      where: { id: params.hackathonId },
      data,
    });

    return NextResponse.json({ message: 'Quick action applied', data: updated });
  } catch (error) {
    console.error('Quick action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

