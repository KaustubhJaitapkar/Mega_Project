import path from 'path';
import fs from 'fs/promises';

const CACHE_ROOT = path.join(process.cwd(), 'code-cache', 'submissions');

export async function ensureCacheRoot(): Promise<void> {
  await fs.mkdir(CACHE_ROOT, { recursive: true });
}

export function getSubmissionCachePath(submissionId: string): string {
  return path.join(CACHE_ROOT, submissionId);
}

export async function isCacheReady(submissionId: string): Promise<boolean> {
  const target = getSubmissionCachePath(submissionId);
  try {
    const entries = await fs.readdir(target);
    return entries.length > 0;
  } catch {
    return false;
  }
}

export function resolveSafePath(baseDir: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\//, '');
  const resolved = path.resolve(baseDir, ...normalized.split('/'));
  const baseResolved = path.resolve(baseDir);
  if (!resolved.startsWith(baseResolved + path.sep) && resolved !== baseResolved) {
    throw new Error('Invalid path');
  }
  return resolved;
}
