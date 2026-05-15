'use client';

import { useEffect, useState, useCallback } from 'react';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: any;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'USER_BANNED', label: 'User Banned' },
  { value: 'USER_UNBANNED', label: 'User Unbanned' },
  { value: 'USER_ROLE_CHANGED', label: 'Role Changed' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'HACKATHON_PAUSED', label: 'Hackathon Paused' },
  { value: 'HACKATHON_RESUMED', label: 'Hackathon Resumed' },
  { value: 'HACKATHON_CANCELLED', label: 'Hackathon Cancelled' },
];

const actionColors: Record<string, { bg: string; text: string }> = {
  USER_BANNED: { bg: '#ffebe9', text: '#cf222e' },
  USER_UNBANNED: { bg: '#dafbe1', text: '#1a7f37' },
  USER_ROLE_CHANGED: { bg: '#ddf4ff', text: '#0550ae' },
  USER_DELETED: { bg: '#ffebe9', text: '#cf222e' },
  HACKATHON_PAUSED: { bg: '#fff8c5', text: '#9a6700' },
  HACKATHON_RESUMED: { bg: '#dafbe1', text: '#1a7f37' },
  HACKATHON_CANCELLED: { bg: '#ffebe9', text: '#cf222e' },
};

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set('action', actionFilter);
    params.set('page', String(page));
    params.set('limit', '30');

    try {
      const res = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 30);

  const formatAction = (action: string) =>
    action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDetails = (log: AuditLog) => {
    const d = log.details as any;
    if (!d) return null;
    const parts: string[] = [];
    if (d.targetName) parts.push(`Target: ${d.targetName}`);
    if (d.targetEmail) parts.push(d.targetEmail);
    if (d.newRole) parts.push(`New role: ${d.newRole}`);
    if (d.title) parts.push(`Hackathon: ${d.title}`);
    if (d.reason) parts.push(`Reason: ${d.reason}`);
    return parts.join(' · ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Track all administrative actions taken on the platform.</p>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-3 py-1.5 text-xs text-[var(--text-primary)]"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="text-xs text-[var(--text-muted)]">{total} entries</span>
      </div>

      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No audit logs found.</div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {logs.map((log) => {
              const colors = actionColors[log.action] || { bg: '#f6f8fa', text: '#57606a' };
              return (
                <div key={log.id} className="flex items-start gap-4 px-4 py-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-[var(--accent)]" style={{ background: 'var(--accent-dim)' }}>
                    {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{log.user?.name || 'Unknown'}</span>
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {formatAction(log.action)}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">{log.targetType}</span>
                    </div>
                    {formatDetails(log) && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">{formatDetails(log)}</p>
                    )}
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-[6px] border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-[6px] border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
