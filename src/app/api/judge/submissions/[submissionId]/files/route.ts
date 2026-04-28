import { NextResponse } from 'next/server';
import { getJudgeSubmissionAccess } from '@/lib/judgeAccess';
import { buildFileTree } from '@/lib/codeReader';
import { getSubmissionCachePath, isCacheReady } from '@/lib/codeCache';

export async function GET(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const access = await getJudgeSubmissionAccess(params.submissionId);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const ready = await isCacheReady(params.submissionId);
    if (!ready) {
      return NextResponse.json({ error: 'Repository not cloned yet' }, { status: 400 });
    }

    const baseDir = getSubmissionCachePath(params.submissionId);
    const tree = await buildFileTree(baseDir);

    return NextResponse.json({ data: tree });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load file tree' }, { status: 500 });
  }
}
