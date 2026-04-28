'use client';

import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

interface CodeReviewPanelProps {
  submissionId: string;
  githubUrl?: string | null;
  isOpen: boolean;
}

function flattenTree(nodes: FileTreeNode[], depth = 0): Array<FileTreeNode & { depth: number }> {
  const flat: Array<FileTreeNode & { depth: number }> = [];
  for (const node of nodes) {
    flat.push({ ...node, depth });
    if (node.isDirectory && node.children?.length) {
      flat.push(...flattenTree(node.children, depth + 1));
    }
  }
  return flat;
}

export default function CodeReviewPanel({ submissionId, githubUrl, isOpen }: CodeReviewPanelProps) {
  const [status, setStatus] = useState<'idle' | 'cloning' | 'ready' | 'error'>('idle');
  const [error, setError] = useState('');
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileTreeNode | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [fileLanguage, setFileLanguage] = useState('plaintext');
  const [loadingFile, setLoadingFile] = useState(false);

  const flatTree = useMemo(() => flattenTree(fileTree), [fileTree]);

  useEffect(() => {
    setStatus('idle');
    setError('');
    setFileTree([]);
    setSelectedFile(null);
    setFileContent('');
    setFileLanguage('plaintext');
  }, [submissionId]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await fetch(`/api/judge/submissions/${submissionId}/status`);
        const data = await res.json();
        if (res.ok && data.data?.ready) {
          await loadFileTree();
        }
      } catch {
        // ignore status errors
      }
    })();
  }, [isOpen, submissionId]);

  async function handleClone() {
    if (!githubUrl) {
      setError('No GitHub URL provided for this submission.');
      return;
    }
    setStatus('cloning');
    setError('');
    try {
      const res = await fetch(`/api/judge/submissions/${submissionId}/clone`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setError(data.error || 'Failed to clone repository');
        return;
      }
      setStatus('ready');
      await loadFileTree();
    } catch (err) {
      setStatus('error');
      setError('Failed to clone repository');
    }
  }

  async function loadFileTree() {
    const res = await fetch(`/api/judge/submissions/${submissionId}/files`);
    const data = await res.json();
    if (!res.ok) {
      setStatus('error');
      setError(data.error || 'Failed to load file tree');
      return;
    }
    setFileTree(data.data || []);
    setStatus('ready');
  }

  async function handleOpenFile(node: FileTreeNode) {
    if (node.isDirectory) return;
    setSelectedFile(node);
    setLoadingFile(true);
    try {
      const res = await fetch(`/api/judge/submissions/${submissionId}/file-content?path=${encodeURIComponent(node.path)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load file');
        setLoadingFile(false);
        return;
      }
      setFileContent(data.data?.content || '');
      setFileLanguage(data.data?.language || 'plaintext');
    } catch {
      setError('Failed to load file');
    } finally {
      setLoadingFile(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{ marginTop: '1.5rem', border: '1px solid var(--border-subtle)', borderRadius: '0.75rem', overflow: 'hidden', background: 'var(--bg-surface)' }}>
      <div style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Code Review</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{githubUrl || 'No GitHub URL'}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="judging-action-btn judging-action-btn--gh"
            onClick={handleClone}
            disabled={status === 'cloning' || !githubUrl}
          >
            {status === 'cloning' ? 'Cloning...' : status === 'ready' ? 'Refresh Files' : 'Clone Repository'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', color: 'var(--error)' }}>{error}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: 280, maxHeight: 420 }}>
        <div style={{ borderRight: '1px solid var(--border-subtle)', padding: '0.6rem', background: 'var(--bg-secondary)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.45rem' }}>
            File Structure
          </div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '0.5rem', background: 'var(--bg-surface)', overflowY: 'auto', overflowX: 'hidden', minHeight: 180, maxHeight: 320, padding: '0.35rem' }}>
          {status !== 'ready' && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>
              {githubUrl ? 'Clone the repository to view files.' : 'GitHub URL is required.'}
            </div>
          )}
          {status === 'ready' && flatTree.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem' }}>No files found.</div>
          )}
          {status === 'ready' && flatTree.map((node) => (
            <button
              key={node.path}
              onClick={() => handleOpenFile(node)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                width: '100%', textAlign: 'left', padding: '0.2rem 0.4rem',
                borderRadius: '0.35rem',
                background: selectedFile?.path === node.path ? 'var(--bg-surface)' : 'transparent',
                color: node.isDirectory ? 'var(--text-muted)' : 'var(--text-primary)',
                fontSize: '0.75rem',
                paddingLeft: `${node.depth * 12 + 6}px`,
              }}
            >
              <span>{node.isDirectory ? '[D]' : '[F]'}</span>
              <span>{node.name}</span>
            </button>
          ))}
          </div>
        </div>
        <div style={{ background: 'var(--bg-root)', position: 'relative' }}>
          {loadingFile && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Loading file...
            </div>
          )}
          <Editor
            height={320}
            language={fileLanguage}
            value={fileContent}
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13 }}
            theme="vs-dark"
          />
        </div>
      </div>
    </div>
  );
}
