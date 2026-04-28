import simpleGit from 'simple-git';
import fs from 'fs/promises';
import { ensureCacheRoot, getSubmissionCachePath } from '@/lib/codeCache';

export async function cloneSubmissionRepo(
  submissionId: string,
  repoUrl: string
): Promise<{ path: string; alreadyCloned: boolean }> {
  await ensureCacheRoot();
  const targetPath = getSubmissionCachePath(submissionId);

  try {
    const entries = await fs.readdir(targetPath);
    if (entries.length > 0) {
      return { path: targetPath, alreadyCloned: true };
    }
  } catch {
    await fs.mkdir(targetPath, { recursive: true });
  }

  const git = simpleGit();
  await git.clone(repoUrl, targetPath, ['--depth', '1']);

  return { path: targetPath, alreadyCloned: false };
}
