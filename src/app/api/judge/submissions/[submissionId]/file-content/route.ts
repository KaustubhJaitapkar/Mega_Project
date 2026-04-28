import { NextResponse } from 'next/server';
import { getJudgeSubmissionAccess } from '@/lib/judgeAccess';
import { getSubmissionCachePath, isCacheReady } from '@/lib/codeCache';
import { readFileContent } from '@/lib/codeReader';

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

    const url = new URL(req.url);
    const filePath = url.searchParams.get('path');
    if (!filePath) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    const baseDir = getSubmissionCachePath(params.submissionId);
    const data = await readFileContent(baseDir, filePath);

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to read file' }, { status: 500 });
  }
}
