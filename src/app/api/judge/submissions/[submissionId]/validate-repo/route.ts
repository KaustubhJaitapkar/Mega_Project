import { NextResponse } from 'next/server';
import { getJudgeSubmissionAccess } from '@/lib/judgeAccess';
import { checkGithubRepo } from '@/lib/submission';

export async function POST(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const access = await getJudgeSubmissionAccess(params.submissionId);
    if ('error' in access) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    if (!access.submission.githubUrl) {
      return NextResponse.json({ error: 'Submission has no GitHub URL' }, { status: 400 });
    }

    const valid = await checkGithubRepo(access.submission.githubUrl);
    return NextResponse.json({ data: { valid } });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to validate repo' }, { status: 500 });
  }
}
