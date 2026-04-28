import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { getJudgeSubmissionAccess } from '@/lib/judgeAccess';
import { getSubmissionCachePath } from '@/lib/codeCache';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const access = await getJudgeSubmissionAccess(params.submissionId);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const target = getSubmissionCachePath(params.submissionId);
    await fs.rm(target, { recursive: true, force: true });

    await prisma.submission.update({
      where: { id: params.submissionId },
      data: { cloneStatus: 'NOT_CLONED', codeCachePath: null, cloneError: null },
    });

    return NextResponse.json({ message: 'Cache cleared' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to clear cache' }, { status: 500 });
  }
}
