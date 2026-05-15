'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalHackathons: number;
  activeHackathons: number;
  totalRegistrations: number;
  totalSubmissions: number;
  totalTeams: number;
  bannedUsers: number;
  newUsersWeek: number;
  newUsersMonth: number;
  usersByRole: { role: string; count: number }[];
  hackathonsByStatus: { status: string; count: number }[];
  recentActivity: any[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
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

  if (!stats) return <p className="text-[var(--text-muted)]">Failed to load stats.</p>;

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers, color: 'var(--accent)', href: '/admin/users' },
    { label: 'Hackathons', value: stats.totalHackathons, color: '#7c3aed', href: null },
    { label: 'Active Events', value: stats.activeHackathons, color: '#16a34a', href: null },
    { label: 'Registrations', value: stats.totalRegistrations, color: '#0891b2', href: null },
    { label: 'Submissions', value: stats.totalSubmissions, color: '#ea580c', href: null },
    { label: 'Teams', value: stats.totalTeams, color: '#2563eb', href: null },
    { label: 'Banned Users', value: stats.bannedUsers, color: '#dc2626', href: '/admin/users?banned=true' },
    { label: 'New (7d)', value: stats.newUsersWeek, color: '#059669', href: null },
  ];

  const actionLabels: Record<string, string> = {
    USER_BANNED: 'Banned user',
    USER_UNBANNED: 'Unbanned user',
    USER_ROLE_CHANGED: 'Changed user role',
    USER_DELETED: 'Deleted user',
    HACKATHON_PAUSED: 'Paused hackathon',
    HACKATHON_RESUMED: 'Resumed hackathon',
    HACKATHON_CANCELLED: 'Cancelled hackathon',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Platform Overview
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Monitor all hackathons, users, and platform activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const card = (
            <div
              key={kpi.label}
              className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--border-strong)]"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">{kpi.label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: kpi.color, fontFamily: 'var(--font-display)' }}>
                {kpi.value}
              </p>
            </div>
          );
          return kpi.href ? (
            <Link key={kpi.label} href={kpi.href} className="no-underline">
              {card}
            </Link>
          ) : (
            card
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Users by Role</h2>
          <div className="space-y-2">
            {stats.usersByRole.map((r) => (
              <div key={r.role} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{r.role}</span>
                <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Hackathons by Status</h2>
          <div className="space-y-2">
            {stats.hackathonsByStatus.map((s) => (
              <div key={s.status} className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">{s.status}</span>
                <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Recent Admin Actions</h2>
        {stats.recentActivity.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No admin actions recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-[6px] border border-[var(--border-subtle)] p-3"
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{log.user?.name || 'Admin'}</span>
                    {' '}
                    {actionLabels[log.action] || log.action}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
