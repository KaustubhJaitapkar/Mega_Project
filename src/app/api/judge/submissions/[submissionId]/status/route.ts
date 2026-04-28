import { NextResponse } from 'next/server';
import { getJudgeSubmissionAccess } from '@/lib/judgeAccess';
import { isCacheReady } from '@/lib/codeCache';

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
    return NextResponse.json({ data: { ready } });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get status' }, { status: 500 });
  }
}
