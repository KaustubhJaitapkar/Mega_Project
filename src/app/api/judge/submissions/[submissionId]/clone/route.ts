import { NextResponse } from 'next/server';
import { cloneSubmissionRepo } from '@/lib/gitClone';
import { getJudgeSubmissionAccess } from '@/lib/judgeAccess';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const access = await getJudgeSubmissionAccess(params.submissionId);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const submission = access.submission;
    if (!submission.githubUrl) {
      return NextResponse.json({ error: 'Submission has no GitHub URL' }, { status: 400 });
    }

    await prisma.submission.update({
      where: { id: submission.id },
      data: { cloneStatus: 'CLONING', cloneError: null },
    });

    const result = await cloneSubmissionRepo(submission.id, submission.githubUrl);

    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        cloneStatus: 'CLONED',
        clonedAt: new Date(),
        codeCachePath: result.path,
        cloneError: null,
      },
    });

    return NextResponse.json({
      message: result.alreadyCloned ? 'Repository already cloned' : 'Repository cloned',
      data: { path: result.path },
    });
  } catch (error: any) {
    const message = error?.message || 'Failed to clone repository';
    try {
      await prisma.submission.update({
        where: { id: params.submissionId },
        data: { cloneStatus: 'FAILED', cloneError: message },
      });
    } catch {
      // ignore update errors
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
