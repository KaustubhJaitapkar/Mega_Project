'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Kanban,
  MessageCircle,
  RefreshCw,
  Send,
  Target,
  Users,
} from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  mentors?: { id: string }[];
}

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
  assignedAt?: string;
  team?: {
    id: string;
    name: string;
    description?: string;
    hackathon?: { id?: string; title: string };
    members?: Array<{ user?: { name: string; profile?: { skills?: string[] } } }>;
    submission?: { technologies?: string[] };
  };
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  isFromMentor: boolean;
  user?: { id: string; name: string; image?: string | null } | null;
  mentor?: { id: string; name: string; image?: string | null } | null;
}

function priorityBadgeClass(p: string): string {
  const x = (p || '').toLowerCase();
  if (x === 'high') return 'badge badge-danger';
  if (x === 'low') return 'badge badge-muted';
  return 'badge badge-primary';
}

function categoryAbbrev(c: string): string {
  if (c === 'technical') return 'TECH';
  if (c === 'judging') return 'JUD';
  if (c === 'general') return 'GEN';
  return (c || '?').slice(0, 4).toUpperCase();
}

export default function MentorDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const mentorId = (session?.user as { id?: string } | undefined)?.id;

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [loadingHackathons, setLoadingHackathons] = useState(true);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assignedTeams, setAssignedTeams] = useState<AssignedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatContent, setChatContent] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatRefreshing, setChatRefreshing] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [category, setCategory] = useState('');
  const [activeTicketId, setActiveTicketId] = useState('');
  const [resolution, setResolution] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success');
  const [resolving, setResolving] = useState(false);
  const [claiming, setClaiming] = useState('');
  const lastChatSigRef = useRef('');

  useEffect(() => {
    if (sessionStatus === 'loading' || !mentorId) return;

    const abort = new AbortController();
    (async () => {
      setLoadingHackathons(true);
      try {
        const res = await fetch('/api/hackathons?limit=50', { signal: abort.signal });
        const list: Hackathon[] = (await res.json()).data || [];
        const filtered = list.filter((h) => h.mentors?.some((m) => m.id === mentorId));
        if (!abort.signal.aborted) setHackathons(filtered);
      } catch {
        if (!abort.signal.aborted) setHackathons([]);
      } finally {
        if (!abort.signal.aborted) setLoadingHackathons(false);
      }
    })();

    return () => abort.abort();
  }, [mentorId, sessionStatus]);

  const showNotice = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setNotice(msg);
    setNoticeType(type);
    setTimeout(() => setNotice(''), 4000);
  }, []);

  const loadTickets = useCallback(async () => {
    if (!selectedHackathon) return;
    const params = new URLSearchParams();
    params.set('hackathonId', selectedHackathon.id);
    if (category) params.set('category', category);
    const res = await fetch(`/api/mentor/tickets?${params.toString()}`);
    const data = await res.json();
    if (res.ok) setTickets(data.data || []);
  }, [selectedHackathon, category]);

  const loadAssignedTeams = useCallback(async () => {
    if (!selectedHackathon) return;
    const res = await fetch(`/api/mentor/teams?hackathonId=${selectedHackathon.id}`);
    const data = await res.json();
    if (res.ok) setAssignedTeams(data.data || []);
  }, [selectedHackathon]);

  useEffect(() => {
    if (!selectedHackathon) return;
    loadTickets();
    loadAssignedTeams();
    const timer = setInterval(loadTickets, 5000);
    return () => clearInterval(timer);
  }, [selectedHackathon, loadTickets, loadAssignedTeams]);

  useEffect(() => {
    if (!assignedTeams.length) {
      setSelectedTeamId('');
      return;
    }
    if (!selectedTeamId || !assignedTeams.some((entry) => entry.team?.id === selectedTeamId)) {
      setSelectedTeamId(assignedTeams[0]?.team?.id || '');
    }
  }, [assignedTeams, selectedTeamId]);

  useEffect(() => {
    setChatMessages([]);
    setChatError('');
    lastChatSigRef.current = '';
  }, [selectedTeamId]);

  const openQueue = useMemo(() => tickets.filter((t) => t.status === 'OPEN'), [tickets]);
  const inProgress = useMemo(() => tickets.filter((t) => t.status === 'IN_PROGRESS'), [tickets]);
  const resolved = useMemo(() => tickets.filter((t) => t.status === 'RESOLVED').slice(0, 10), [tickets]);

  /** Single in-flight ticket defaults focus; multiple require an explicit selection. */
  const resolvedFocusTicketId =
    activeTicketId || (inProgress.length === 1 ? inProgress[0].id : '');

  const selectedTeam = useMemo(
    () => assignedTeams.find((entry) => entry.team?.id === selectedTeamId),
    [assignedTeams, selectedTeamId]
  );

  const loadChat = useCallback(
    async (opts?: { refreshing?: boolean }) => {
      if (!selectedTeamId) {
        setChatMessages([]);
        setChatError('');
        lastChatSigRef.current = '';
        return;
      }

      if (opts?.refreshing) setChatRefreshing(true);
      else setChatLoading(true);

      try {
        const res = await fetch(`/api/teams/${selectedTeamId}/chat`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          setChatError(data.error || 'Failed to load chat');
          return;
        }

        const nextMessages: ChatMessage[] = data.data?.messages || [];
        const nextSig = nextMessages.length
          ? `${nextMessages.length}:${nextMessages[nextMessages.length - 1]?.id}`
          : '0:empty';

        if (nextSig !== lastChatSigRef.current) {
          setChatMessages(nextMessages);
          lastChatSigRef.current = nextSig;
        }
        setChatError('');
      } catch {
        setChatError('Failed to load chat');
      } finally {
        setChatLoading(false);
        setChatRefreshing(false);
      }
    },
    [selectedTeamId]
  );

  useEffect(() => {
    if (!selectedTeamId) return;
    loadChat();
    const timer = setInterval(() => loadChat(), 4000);
    return () => clearInterval(timer);
  }, [selectedTeamId, loadChat]);

  async function claim(ticketId: string) {
    setClaiming(ticketId);
    try {
      const res = await fetch(`/api/mentor/tickets/${ticketId}/claim`, { method: 'POST' });
      const data = await res.json();
      showNotice(res.ok ? 'Ticket claimed' : data.error || 'Claim failed', res.ok ? 'success' : 'error');
      if (res.ok) setActiveTicketId(ticketId);
      await Promise.all([loadTickets(), loadAssignedTeams()]);
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
      await loadTickets();
    } finally {
      setResolving(false);
    }
  }

  async function sendChatMessage() {
    if (!selectedTeamId || !chatContent.trim()) return;
    const draft = chatContent.trim();
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      content: draft,
      createdAt: new Date().toISOString(),
      isFromMentor: true,
      mentor: { id: 'mentor', name: 'You' },
    };

    setChatMessages((prev) => [...prev, optimistic]);
    setChatContent('');
    setChatSending(true);
    try {
      const res = await fetch(`/api/teams/${selectedTeamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || 'Failed to send message');
        setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
        return;
      }

      setChatMessages((prev) => prev.map((msg) => (msg.id === optimisticId ? data.data : msg)));
      setChatError('');
    } catch {
      setChatError('Failed to send message');
      setChatMessages((prev) => prev.filter((msg) => msg.id !== optimisticId));
    } finally {
      setChatSending(false);
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

  function formatChatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const shellCls =
    'rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]';

  // --- Hackathon selector ---
  if (!selectedHackathon) {
    if (sessionStatus === 'loading' || loadingHackathons) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center font-sans">
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
              role="status"
              aria-label="Loading"
            />
            <p className="font-mono text-[12px] text-[var(--text-muted)]">Loading workspace</p>
          </div>
        </div>
      );
    }

    return (
      <div className="text-[var(--text-primary)]">
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <Target className="h-6 w-6 text-[var(--accent)]" aria-hidden />
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Mentor</p>
            </div>
            <h1 className="text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight">
              Mentor dashboard
            </h1>
            <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Choose an event to open your ticket queue, assigned teams, and inline chat.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className={`${shellCls} border-l-4 border-l-[var(--accent)] p-4`}>
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                Events on your roster
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                {hackathons.length}
              </p>
            </div>
            <div className={`${shellCls} border-l-4 border-l-[var(--warning)] p-4`}>
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Focus</p>
              <p className="mt-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
                Clear blockers and keep teams unblocked.
              </p>
            </div>
            <div className={`${shellCls} border-l-4 border-l-[var(--success)] p-4 sm:col-span-2 lg:col-span-1`}>
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Next step</p>
              <p className="mt-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
                Open an event below to load tickets and teams.
              </p>
            </div>
          </div>

          {hackathons.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent)]">
                <Inbox className="h-6 w-6" aria-hidden />
              </div>
              <p className="mt-4 text-[15px] text-[var(--text-secondary)]">No hackathons assigned yet.</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">Organisers add mentors per event.</p>
            </div>
          ) : (
            <div>
              <h2 className="mb-4 font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                Your events
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {hackathons.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHackathon(h)}
                    className={`${shellCls} group text-left transition-[box-shadow,border-color] hover:border-[var(--border-strong)] hover:shadow-md`}
                  >
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{h.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`org-badge ${h.status === 'ONGOING' ? 'org-badge-success' : 'org-badge-muted'}`}>
                        {h.status}
                      </span>
                      <span className="badge badge-muted">
                        {new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className="btn btn-primary mt-4 flex min-h-[40px] w-full items-center justify-center">
                      Open mentoring panel
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Workspace ---
  return (
    <div className="text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => {
                setSelectedHackathon(null);
                setTickets([]);
                setAssignedTeams([]);
                setChatMessages([]);
                setActiveTicketId('');
                setResolution('');
              }}
              className="mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              All events
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <Kanban className="h-6 w-6 shrink-0 text-[var(--accent)]" aria-hidden />
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Mentor workspace</p>
            </div>
            <h1 className="mt-2 text-[clamp(1.2rem,2.2vw,1.65rem)] font-semibold leading-tight tracking-tight">
              {selectedHackathon.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:pt-1">
            <span className="font-mono text-[11px] text-[var(--text-muted)]">Queue</span>
            <span className="badge badge-warning">{openQueue.length} open</span>
            <span className="badge badge-primary">{inProgress.length} active</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
        {notice && (
          <div
            role="status"
            className={`mb-6 rounded-[var(--radius-lg)] border px-4 py-3 text-sm font-medium ${
              noticeType === 'success'
                ? 'border-[var(--success)] bg-[rgba(26,127,55,0.08)] text-[var(--success)]'
                : 'border-[var(--error)] bg-[var(--error-dim)] text-[var(--error)]'
            }`}
          >
            {notice}
          </div>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className={`${shellCls} border-l-4 border-l-[var(--warning)] p-4`}>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Open tickets</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {openQueue.length}
            </p>
          </div>
          <div className={`${shellCls} border-l-4 border-l-[var(--accent)] p-4`}>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">In progress</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {inProgress.length}
            </p>
          </div>
          <div className={`${shellCls} border-l-4 border-l-[var(--success)] p-4`}>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">My teams</p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {assignedTeams.length}
            </p>
          </div>
        </div>

        <div className={`${shellCls} mb-6 flex flex-wrap items-end gap-4 p-4`}>
          <div className="min-w-[180px] flex-1">
            <label htmlFor="mentor-ticket-category" className="mb-1 block font-mono text-[12px] text-[var(--text-muted)]">
              Filter by category
            </label>
            <select
              id="mentor-ticket-category"
              className="input h-11 w-full max-w-xs rounded-[var(--radius-lg)] text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              <option value="technical">Technical</option>
              <option value="general">General</option>
              <option value="judging">Judging</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Open queue */}
          <section className={`${shellCls} flex min-h-0 flex-col p-4 lg:col-span-4`} aria-labelledby="open-queue-heading">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                <h2 id="open-queue-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                  Open queue
                </h2>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">{openQueue.length} tickets</span>
            </div>
            <div className="flex max-h-[min(520px,70vh)] flex-col gap-2 overflow-y-auto pr-1">
              {openQueue.map((t) => (
                <div key={t.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-root)] p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {categoryAbbrev(t.category)}
                      </span>
                      <span className={priorityBadgeClass(t.priority)}>{t.priority}</span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">{timeSince(t.createdAt)}</span>
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">{t.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[var(--text-muted)]">{t.creator?.name || 'Unknown'}</span>
                    <button
                      type="button"
                      className="btn btn-primary min-h-[32px] px-3 py-1.5 text-xs"
                      onClick={() => claim(t.id)}
                      disabled={claiming === t.id}
                    >
                      {claiming === t.id ? 'Claiming…' : 'Claim'}
                    </button>
                  </div>
                </div>
              ))}
              {openQueue.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">No open tickets</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">New requests appear here.</p>
                </div>
              )}
            </div>
          </section>

          {/* In progress */}
          <section className={`${shellCls} flex min-h-0 flex-col p-4 lg:col-span-4`} aria-labelledby="in-progress-heading">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Kanban className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                <h2 id="in-progress-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                  In progress
                </h2>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">{inProgress.length} active</span>
            </div>
            {inProgress.length > 1 && !activeTicketId && (
              <p className="mb-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-root)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                Select a ticket below to add resolution notes.
              </p>
            )}
            <div className="flex max-h-[min(520px,70vh)] flex-col gap-2 overflow-y-auto pr-1">
              {inProgress.map((t) => {
                const isFocused = resolvedFocusTicketId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`rounded-[var(--radius-lg)] border p-3 transition-colors ${
                      isFocused
                        ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-root)]'
                    }`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="badge badge-primary">In progress</span>
                      <span className="font-mono text-[11px] text-[var(--text-muted)]">{timeSince(t.createdAt)}</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{t.description}</p>

                    {!isFocused && inProgress.length > 1 && (
                      <button
                        type="button"
                        className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)] hover:underline"
                        onClick={() => {
                          setActiveTicketId(t.id);
                          setResolution('');
                        }}
                      >
                        Focus to resolve
                      </button>
                    )}

                    {isFocused && (
                      <div className="mt-3 flex flex-col gap-2">
                        <textarea
                          className="input min-h-[60px] resize-y text-sm"
                          placeholder="Resolution notes…"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary min-h-[38px] w-full text-sm"
                          onClick={() => resolveTicket(t.id)}
                          disabled={resolving}
                        >
                          {resolving ? 'Resolving…' : 'Resolve ticket'}
                        </button>
                      </div>
                    )}

                    {!isFocused && (
                      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                        {t.assignedTo?.name ? `Assigned · ${t.assignedTo.name}` : 'Assigned'}
                      </p>
                    )}
                  </div>
                );
              })}
              {inProgress.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">No active tickets</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">Claim one from the open queue.</p>
                </div>
              )}
            </div>
          </section>

          {/* Teams + chat + resolved */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            <section className={`${shellCls} p-4`} aria-labelledby="teams-heading">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                <h2 id="teams-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                  My teams
                </h2>
              </div>
              <div className="flex max-h-60 flex-col gap-2 overflow-y-auto pr-1">
                {assignedTeams.map((entry) => {
                  const teamSkills = Array.from(
                    new Set([
                      ...(entry.team?.members?.flatMap((m) => m.user?.profile?.skills || []) || []),
                      ...(entry.team?.submission?.technologies || []),
                    ])
                  );
                  const isSelected = entry.team?.id === selectedTeamId;
                  return (
                    <div
                      key={entry.team?.id}
                      className={`rounded-[var(--radius-lg)] border p-3 ${
                        isSelected
                          ? 'border-[var(--border-accent)] bg-[var(--accent-dim)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-root)]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTeamId(entry.team?.id || '')}
                          className="min-w-0 flex-1 text-left text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
                        >
                          {entry.team?.name || 'Team'}
                        </button>
                        <Link
                          href={`/mentor/teams/${entry.team?.id}/chat`}
                          className="shrink-0 font-mono text-[11px] font-semibold text-[var(--accent)] no-underline hover:underline"
                        >
                          Full chat →
                        </Link>
                      </div>
                      {teamSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {teamSkills.slice(0, 5).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-[4px] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]"
                            >
                              {skill}
                            </span>
                          ))}
                          {teamSkills.length > 5 && (
                            <span className="rounded-[4px] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
                              +{teamSkills.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {assignedTeams.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--text-muted)]">No teams assigned yet.</p>
                )}
              </div>
            </section>

            <section className={`${shellCls} flex flex-col p-4`} aria-labelledby="chat-heading">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                    <h2 id="chat-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                      Team chat
                    </h2>
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                    {selectedTeam?.team?.name || 'Select a team'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary inline-flex min-h-[32px] items-center gap-1.5 px-3 text-xs"
                  onClick={() => loadChat({ refreshing: true })}
                  disabled={chatRefreshing || !selectedTeamId}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${chatRefreshing ? 'animate-spin' : ''}`} aria-hidden />
                  {chatRefreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {chatError && (
                <div className="mb-3 rounded-[var(--radius-lg)] border border-[var(--error)] bg-[var(--error-dim)] px-3 py-2 text-xs text-[var(--error)]">
                  {chatError}
                </div>
              )}

              <div className="flex min-h-[220px] max-h-[320px] flex-col gap-2 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-root)] p-2">
                {!selectedTeamId ? (
                  <div className="grid flex-1 place-items-center px-4 text-center text-sm text-[var(--text-muted)]">
                    No team selected.
                  </div>
                ) : chatLoading && chatMessages.length === 0 ? (
                  <div className="grid flex-1 place-items-center text-sm text-[var(--text-muted)]">
                    Loading conversation…
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="grid flex-1 place-items-center text-sm text-[var(--text-muted)]">
                    No messages yet.
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const fromMentor = msg.isFromMentor;
                    const senderName = fromMentor ? msg.mentor?.name || 'Mentor' : msg.user?.name || 'Team';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${fromMentor ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-[14px] border px-3 py-2 ${
                            fromMentor
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-inverse)]'
                              : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                          }`}
                        >
                          <p className="text-[10px] opacity-80">{senderName}</p>
                          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                          <p className="mt-1 text-[10px] opacity-75">{formatChatTime(msg.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border-default)] pt-3">
                <textarea
                  className="input min-h-[84px] resize-y text-sm"
                  placeholder={selectedTeamId ? 'Reply to team…' : 'Select a team to chat'}
                  value={chatContent}
                  onChange={(e) => setChatContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!chatSending && chatContent.trim()) sendChatMessage();
                    }
                  }}
                  disabled={!selectedTeamId || chatSending}
                  rows={3}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] text-[var(--text-muted)]">Enter sends · Shift+Enter for newline</p>
                  <button
                    type="button"
                    className="btn btn-primary inline-flex min-h-[38px] items-center gap-2 px-4 text-sm"
                    onClick={sendChatMessage}
                    disabled={!selectedTeamId || chatSending || !chatContent.trim()}
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    {chatSending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </section>

            <section className={`${shellCls} p-4`} aria-labelledby="resolved-heading">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" aria-hidden />
                <h2 id="resolved-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                  Recently resolved
                </h2>
              </div>
              <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto pr-1">
                {resolved.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--text-secondary)]">{t.title}</p>
                      <p className="font-mono text-[10px] text-[var(--text-muted)]">
                        {t.resolvedAt ? timeSince(t.resolvedAt) : ''}
                      </p>
                    </div>
                    <span className="badge badge-success shrink-0">Done</span>
                  </div>
                ))}
                {resolved.length === 0 && (
                  <p className="py-4 text-center text-sm text-[var(--text-muted)]">No resolved tickets yet.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
