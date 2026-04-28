import fs from 'fs/promises';
import path from 'path';
import { resolveSafePath } from '@/lib/codeCache';

const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.turbo']);
const SKIP_FILES = new Set(['.env', '.env.local', '.env.production']);

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

export async function buildFileTree(baseDir: string, relativePath = ''): Promise<FileTreeNode[]> {
  const fullPath = relativePath ? resolveSafePath(baseDir, relativePath) : baseDir;
  const entries = await fs.readdir(fullPath, { withFileTypes: true });

  const nodes: FileTreeNode[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      if (entry.isDirectory() || SKIP_FILES.has(entry.name)) {
        continue;
      }
    }

    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const entryPath = path.posix.join(relativePath.split(path.sep).join('/'), entry.name);
    const node: FileTreeNode = {
      name: entry.name,
      path: entryPath,
      isDirectory: entry.isDirectory(),
    };

    if (entry.isDirectory()) {
      node.children = await buildFileTree(baseDir, entryPath);
    }

    nodes.push(node);
  }

  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return nodes;
}

const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  py: 'python',
  html: 'html',
  css: 'css',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
  sh: 'bash',
  env: 'plaintext',
  dockerfile: 'dockerfile',
  txt: 'plaintext',
  prisma: 'prisma',
};

export function detectLanguage(filePath: string): string {
  const base = filePath.split('/').pop() || '';
  if (base.toLowerCase() === 'dockerfile') return 'dockerfile';
  const ext = base.includes('.') ? base.split('.').pop() || '' : '';
  return LANGUAGE_MAP[ext.toLowerCase()] || 'plaintext';
}

export async function readFileContent(baseDir: string, relativePath: string): Promise<{ content: string; language: string }> {
  const fullPath = resolveSafePath(baseDir, relativePath);
  const stats = await fs.stat(fullPath);
  const maxBytes = 512 * 1024;
  if (stats.size > maxBytes) {
    throw new Error('File too large to preview');
  }
  const buffer = await fs.readFile(fullPath);
  return {
    content: buffer.toString('utf8'),
    language: detectLanguage(relativePath),
  };
}
