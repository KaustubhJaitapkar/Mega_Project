'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  bannedAt: string | null;
  createdAt: string;
  image: string | null;
  _count: { teamMembers: number; registrations: number; hackathonsOrganised: number };
}

const ALL_ROLES = ['ALL', 'PARTICIPANT', 'ORGANISER', 'JUDGE', 'MENTOR', 'SPONSOR', 'ADMIN'];

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'ALL');
  const [banFilter, setBanFilter] = useState(searchParams.get('banned') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter !== 'ALL') params.set('role', roleFilter);
    if (banFilter) params.set('banned', banFilter);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {} finally {
      setLoading(false);
    }
  }, [roleFilter, banFilter, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const performAction = async (userId: string, action: string, method = 'POST', body?: any) => {
    setActionLoading(userId + action);
    try {
      const url = action === 'delete'
        ? `/api/admin/users/${userId}`
        : action === 'role'
          ? `/api/admin/users/${userId}`
          : `/api/admin/users/${userId}/${action}`;

      const res = await fetch(url, {
        method: action === 'delete' ? 'DELETE' : action === 'role' ? 'PUT' : 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (res.ok) fetchUsers();
    } catch {} finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          User Management
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">View, filter, and manage all platform users.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {ALL_ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRoleFilter(r); setPage(1); }}
              className={`rounded-[6px] px-2.5 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                  : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]'
              }`}
            >
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <select
          value={banFilter}
          onChange={(e) => { setBanFilter(e.target.value); setPage(1); }}
          className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
        >
          <option value="">All statuses</option>
          <option value="false">Active</option>
          <option value="true">Banned</option>
        </select>

        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-w-[200px] flex-1 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-[var(--border-subtle)] last:border-0">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{u.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => performAction(u.id, 'role', 'PUT', { role: e.target.value })}
                        disabled={actionLoading === u.id + 'role'}
                        className="rounded-[4px] border border-[var(--border-default)] bg-[var(--bg-root)] px-2 py-1 text-xs text-[var(--text-primary)]"
                      >
                        {['PARTICIPANT', 'ORGANISER', 'JUDGE', 'MENTOR', 'SPONSOR', 'ADMIN'].map((r) => (
                          <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {u._count.registrations} regs &middot; {u._count.teamMembers} teams
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {u.isBanned ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ffebe9] px-2 py-0.5 text-[10px] font-semibold text-[#cf222e]">
                          Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#dafbe1] px-2 py-0.5 text-[10px] font-semibold text-[#1a7f37]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.isBanned ? (
                          <button
                            onClick={() => performAction(u.id, 'unban')}
                            disabled={actionLoading === u.id + 'unban'}
                            className="rounded-[4px] bg-[#dafbe1] px-2 py-1 text-[10px] font-medium text-[#1a7f37] hover:bg-[#b6f0c3]"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => performAction(u.id, 'ban')}
                            disabled={actionLoading === u.id + 'ban'}
                            className="rounded-[4px] bg-[#ffebe9] px-2 py-1 text-[10px] font-medium text-[#cf222e] hover:bg-[#ffc9c5]"
                          >
                            Ban
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete user "${u.name}"? This cannot be undone.`)) {
                              performAction(u.id, 'delete');
                            }
                          }}
                          disabled={actionLoading === u.id + 'delete'}
                          className="rounded-[4px] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-raised)] hover:text-[#cf222e]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-[6px] border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-[var(--text-muted)]">{page} / {totalPages}</span>
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
