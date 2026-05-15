'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalUsers: number;
  totalHackathons: number;
  activeHackathons: number;
  totalRegistrations: number;
  totalSubmissions: number;
  totalTeams: number;
  newUsersWeek: number;
  newUsersMonth: number;
  usersByRole: { role: string; count: number }[];
  hackathonsByStatus: { status: string; count: number }[];
}

interface Hackathon {
  id: string;
  title: string;
  status: string;
  isPaused: boolean;
  startDate: string;
  endDate: string;
  prize: string | null;
  organiser: { name: string; email: string };
  _count: { teams: number; submissions: number; registrations: number; helpTickets: number };
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/hackathons?limit=50').then((r) => r.json()),
    ])
      .then(([s, h]) => {
        setStats(s);
        setHackathons(h.hackathons || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    PARTICIPANT: '#2563eb',
    ORGANISER: '#7c3aed',
    JUDGE: '#ea580c',
    MENTOR: '#16a34a',
    SPONSOR: '#0891b2',
    ADMIN: '#dc2626',
  };

  const statusColors: Record<string, string> = {
    DRAFT: '#6b7280',
    REGISTRATION: '#2563eb',
    ONGOING: '#16a34a',
    ENDED: '#6b7280',
    CANCELLED: '#dc2626',
  };

  const maxRoleCount = Math.max(...(stats?.usersByRole.map((r) => r.count) || [1]));
  const maxStatusCount = Math.max(...(stats?.hackathonsByStatus.map((s) => s.count) || [1]));

  const exportCSV = () => {
    const headers = ['Title', 'Status', 'Organiser', 'Teams', 'Submissions', 'Registrations', 'Tickets', 'Prize'];
    const rows = hackathons.map((h) => [
      h.title,
      h.status,
      h.organiser.name,
      h._count.teams,
      h._count.submissions,
      h._count.registrations,
      h._count.helpTickets,
      h.prize || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hackathons-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Analytics & Reports
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Platform-wide data visualization and exportable reports.</p>
        </div>
        <button
          onClick={exportCSV}
          className="rounded-[6px] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--text-inverse)] hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      {stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Users by Role</h2>
            <div className="space-y-3">
              {stats.usersByRole.map((r) => (
                <div key={r.role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">{r.role}</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">{r.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-raised)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(r.count / maxRoleCount) * 100}%`,
                        backgroundColor: roleColors[r.role] || 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Hackathons by Status</h2>
            <div className="space-y-3">
              {stats.hackathonsByStatus.map((s) => (
                <div key={s.status} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">{s.status}</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)]">{s.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-raised)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(s.count / maxStatusCount) * 100}%`,
                        backgroundColor: statusColors[s.status] || 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">All Hackathons</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Organiser</th>
                <th className="px-3 py-2 text-right">Teams</th>
                <th className="px-3 py-2 text-right">Submissions</th>
                <th className="px-3 py-2 text-right">Registrations</th>
                <th className="px-3 py-2 text-right">Tickets</th>
                <th className="px-3 py-2 text-right">Prize</th>
              </tr>
            </thead>
            <tbody>
              {hackathons.map((h) => (
                <tr key={h.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                    {h.title}
                    {h.isPaused && (
                      <span className="ml-2 inline-flex rounded-full bg-[#fff8c5] px-1.5 py-0.5 text-[10px] font-semibold text-[#9a6700]">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        backgroundColor: (statusColors[h.status] || '#6b7280') + '20',
                        color: statusColors[h.status] || '#6b7280',
                      }}
                    >
                      {h.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-[var(--text-muted)]">{h.organiser.name}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{h._count.teams}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{h._count.submissions}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{h._count.registrations}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{h._count.helpTickets}</td>
                  <td className="px-3 py-2 text-right text-xs text-[var(--text-muted)]">{h.prize || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
