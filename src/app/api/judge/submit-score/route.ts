import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseHackathonMeta } from '@/lib/hackathonMeta';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const judge = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!judge || judge.role !== 'JUDGE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { hackathonId, submissionId, scores, notes, seal } = body as {
      hackathonId: string;
      submissionId: string;
      scores: Array<{ rubricItemId: string; score: number }>;
      notes?: string;
      seal?: boolean;
    };

    if (!hackathonId || !submissionId || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: { judges: { select: { id: true } } },
    });
    if (!hackathon || !hackathon.judges.some((j) => j.id === judge.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const meta = parseHackathonMeta(hackathon.rules);
    if (!meta.judgingOpen) {
      return NextResponse.json({ error: 'Judging round is closed' }, { status: 400 });
    }

    const rubric = await prisma.rubric.findFirst({
      where: { hackathonId, isActive: true },
      include: { items: true },
    });
    if (!rubric) {
      return NextResponse.json({ error: 'No active rubric found' }, { status: 400 });
    }

    const itemIds = rubric.items.map((i) => i.id);
    const sentIds = scores.map((s) => s.rubricItemId);
    const allScored = itemIds.every((id) => sentIds.includes(id));
    if (!allScored) {
      return NextResponse.json({ error: 'All criteria must be scored' }, { status: 400 });
    }

    const existing = await prisma.score.findMany({
      where: { submissionId, judgerId: judge.id },
    });
    if (existing.some((s) => s.isSealed)) {
      return NextResponse.json({ error: 'Scores are sealed and cannot be edited' }, { status: 400 });
    }

    const map = new Map(rubric.items.map((i) => [i.id, i]));
    let weightedTotal = 0;
    for (const row of scores) {
      const item = map.get(row.rubricItemId);
      if (!item) {
        return NextResponse.json({ error: 'Invalid rubric item' }, { status: 400 });
      }
      if (row.score < 0 || row.score > item.maxScore) {
        return NextResponse.json({ error: `Score out of range for ${item.name}` }, { status: 400 });
      }
      weightedTotal += (row.score / item.maxScore) * item.weight * 100;
    }
    weightedTotal = Number((weightedTotal / 100).toFixed(2));

    await prisma.$transaction([
      prisma.score.deleteMany({
        where: { submissionId, judgerId: judge.id },
      }),
      ...scores.map((row, idx) =>
        prisma.score.create({
          data: {
            submissionId,
            rubricItemId: row.rubricItemId,
            judgerId: judge.id,
            score: row.score,
            comment: idx === 0 ? `${notes || ''}\nWeighted total: ${weightedTotal}` : '',
            isSealed: !!seal,
          },
        })
      ),
    ]);

    return NextResponse.json({
      message: seal ? 'Scores submitted and sealed' : 'Scores saved',
      data: { weightedTotal, sealed: !!seal },
    });
  } catch (error) {
    console.error('Submit score error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

