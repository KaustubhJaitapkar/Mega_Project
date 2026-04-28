import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getJudgeSubmissionAccess(submissionId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { status: 401, error: 'Unauthorized' as const };
  }

  const judge = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!judge || judge.role !== 'JUDGE') {
    return { status: 403, error: 'Forbidden' as const };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { hackathon: { include: { judges: { select: { id: true } } } } },
  });

  if (!submission) {
    return { status: 404, error: 'Submission not found' as const };
  }

  if (!submission.hackathon.judges.some((j) => j.id === judge.id)) {
    return { status: 403, error: 'Forbidden' as const };
  }

  return { submission, judge } as const;
}
