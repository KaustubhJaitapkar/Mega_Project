'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  resolvedAt?: string;
  creator: { id: string; name: string };
  assignedTo?: { id: string; name: string };
  hackathon: { id: string; title: string };
}

interface AssignedTeam {
  team?: {
    id: string;
    name: string;
    description?: string;
    hackathon?: { title: string };
    members?: Array<{ user?: { name: string; profile?: { skills?: string[] } } }>;
    submission?: { technologies?: string[] };
  };
}

export default function MentorDashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<AssignedTeam[]>([]);
  const [category, setCategory] = useState('');
  const [activeTicketId, setActiveTicketId] = useState('');
  const [resolution, setResolution] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success');
  const [resolving, setResolving] = useState(false);
  const [claiming, setClaiming] = useState('');

  const showNotice = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotice(msg);
    setNoticeType(type);
    setTimeout(() => setNotice(''), 4000);
  }, []);

  const loadTickets = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    const res = await fetch(`/api/mentor/tickets?${params.toString()}`);
    const data = await res.json();
    setTickets(data.data || []);
  }, [category]);

  const loadAssignedTeams = useCallback(async () => {
    const res = await fetch('/api/mentor/teams');
    const data = await res.json();
    setAssignedTeams(data.data || []);
  }, []);

  useEffect(() => {
    loadTickets();
    loadAssignedTeams();
    const timer = setInterval(loadTickets, 5000);
    return () => clearInterval(timer);
  }, [loadTickets, loadAssignedTeams]);

  const openQueue = useMemo(() => tickets.filter((t) => t.status === 'OPEN'), [tickets]);
  const inProgress = useMemo(() => tickets.filter((t) => t.status === 'IN_PROGRESS'), [tickets]);
  const resolved = useMemo(() => tickets.filter((t) => t.status === 'RESOLVED').slice(0, 10), [tickets]);

  async function claim(ticketId: string) {
    setClaiming(ticketId);
    try {
      const res = await fetch(`/api/mentor/tickets/${ticketId}/claim`, { method: 'POST' });
      const data = await res.json();
      showNotice(res.ok ? 'Ticket claimed' : data.error || 'Claim failed', res.ok ? 'success' : 'error');
      if (res.ok) setActiveTicketId(ticketId);
      loadTickets();
    } finally {
      setClaiming('');
    }
  }

  async function resolveTicket(ticketId: string) {
    setResolving(true);
    try {
      const res = await fetch(`/api/mentor/tickets/${ticketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });
      const data = await res.json();
      showNotice(res.ok ? 'Ticket resolved' : data.error || 'Resolve failed', res.ok ? 'success' : 'error');
      if (res.ok) {
        setResolution('');
        setActiveTicketId('');
      }
      loadTickets();
    } finally {
      setResolving(false);
    }
  }

  function timeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  function getPriorityColor(p: string) {
    if (p === 'high') return { bg: 'bg-red-100', text: 'text-red-700' };
    if (p === 'low') return { bg: 'bg-gray-100', text: 'text-gray-600' };
    return { bg: 'bg-blue-100', text: 'text-blue-700' };
  }

  function getCategoryIcon(c: string) {
    if (c === 'technical') return '{ }';
    if (c === 'judging') return '#';
    return '?';
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="text-gray-500 mt-1">Help teams solve problems and unblock their progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Queue:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700">
            {openQueue.length} open
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-indigo-100 text-indigo-700">
            {inProgress.length} active
          </span>
        </div>
      </div>

      {notice && (
        <div className={`p-3 rounded-lg text-sm font-medium ${
          noticeType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {notice}
        </div>
      )}

      {/* Filter */}
      <div className="card flex gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Filter by category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
            <option value="judging">Judging</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Queue */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Open Queue</h2>
            <span className="text-xs text-gray-400">{openQueue.length} tickets</span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {openQueue.map((t) => {
              const pc = getPriorityColor(t.priority);
              return (
                <div key={t.id} className="p-4 border rounded-lg hover:border-indigo-200 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {getCategoryIcon(t.category)}
                      </span>
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${pc.bg} ${pc.text}`}>
                        {t.priority}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{timeSince(t.createdAt)}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{t.title}</p>
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      by {t.creator?.name || 'Unknown'} &middot; {t.hackathon?.title || ''}
                    </span>
                    <button
                      className="btn btn-primary text-xs px-3 py-1.5"
                      onClick={() => claim(t.id)}
                      disabled={claiming === t.id}
                    >
                      {claiming === t.id ? 'Claiming...' : 'Claim'}
                    </button>
                  </div>
                </div>
              );
            })}
            {openQueue.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No open tickets</p>
                <p className="text-xs text-gray-300 mt-1">New requests will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Active / In Progress */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">In Progress</h2>
            <span className="text-xs text-gray-400">{inProgress.length} active</span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {inProgress.map((t) => {
              const isActive = activeTicketId === t.id || !activeTicketId;
              return (
                <div key={t.id} className={`p-4 border rounded-lg ${isActive ? 'border-indigo-300 bg-indigo-50/50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                      In Progress
                    </span>
                    <span className="text-xs text-gray-400">{timeSince(t.createdAt)}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{t.title}</p>
                  <p className="text-xs text-gray-500 mb-3">{t.description}</p>

                  {isActive && (
                    <div className="space-y-2">
                      <textarea
                        className="input min-h-[60px] text-sm"
                        placeholder="Write your resolution notes..."
                        value={activeTicketId === t.id ? resolution : ''}
                        onChange={(e) => {
                          setActiveTicketId(t.id);
                          setResolution(e.target.value);
                        }}
                      />
                      <button
                        className="btn btn-primary w-full text-sm"
                        onClick={() => resolveTicket(t.id)}
                        disabled={resolving}
                      >
                        {resolving ? 'Resolving...' : 'Resolve Ticket'}
                      </button>
                    </div>
                  )}

                  {!isActive && (
                    <p className="text-xs text-gray-400">
                      Claimed by {t.assignedTo?.name || 'another mentor'}
                    </p>
                  )}
                </div>
              );
            })}
            {inProgress.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">No active tickets</p>
                <p className="text-xs text-gray-300 mt-1">Claim a ticket from the queue</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Teams & Recent */}
        <div className="space-y-6">
          {/* Assigned Teams */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Teams</h2>
            <div className="space-y-3 max-h-[240px] overflow-y-auto">
              {assignedTeams.map((entry) => {
                const teamSkills = [
                  ...new Set([
                    ...(entry.team?.members?.flatMap((m) => m.user?.profile?.skills || []) || []),
                    ...(entry.team?.submission?.technologies || []),
                  ]),
                ];
                return (
                  <div key={entry.team?.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-gray-900">{entry.team?.name || 'Team'}</p>
                      <Link
                        href={`/mentor/teams/${entry.team?.id}/chat`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Chat &rarr;
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{entry.team?.hackathon?.title || ''}</p>
                    {teamSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {teamSkills.slice(0, 5).map((skill) => (
                          <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                            {skill}
                          </span>
                        ))}
                        {teamSkills.length > 5 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                            +{teamSkills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {assignedTeams.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No teams assigned yet</p>
              )}
            </div>
          </div>

          {/* Recently Resolved */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recently Resolved</h2>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {resolved.map((t) => (
                <div key={t.id} className="p-2 border rounded flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{t.title}</p>
                    <p className="text-xs text-gray-400">{t.resolvedAt ? timeSince(t.resolvedAt) : ''}</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-semibold flex-shrink-0">
                    DONE
                  </span>
                </div>
              ))}
              {resolved.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No resolved tickets yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
