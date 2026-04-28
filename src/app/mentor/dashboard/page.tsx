'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Hackathon { id: string; title: string; status: string; startDate: string; endDate: string }

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

export default function MentorDashboardPage() {
  const { data: session } = useSession();
  const mentorId = (session?.user as any)?.id;

  // Hackathon selection state
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathon, setSelectedHackathon] = useState<Hackathon | null>(null);
  const [loadingHackathons, setLoadingHackathons] = useState(true);

  // Workspace state (scoped to selected hackathon)
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

  // Load hackathons where this mentor is assigned
  useEffect(() => {
    if (!mentorId) return;
    (async () => {
      try {
        const res = await fetch('/api/hackathons?limit=50');
        const list = (await res.json()).data || [];
        const filtered = list.filter((h: any) =>
          h.mentors?.some((m: any) => m.id === mentorId)
        );
        setHackathons(filtered);
      } catch { /* silent */ }
      finally { setLoadingHackathons(false); }
    })();
  }, [mentorId]);

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
  const selectedTeam = useMemo(
    () => assignedTeams.find((entry) => entry.team?.id === selectedTeamId),
    [assignedTeams, selectedTeamId]
  );

  const loadChat = useCallback(async (opts?: { refreshing?: boolean }) => {
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
  }, [selectedTeamId]);

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

  function getPriorityColor(p: string) {
    if (p === 'high') return '#ef4444';
    if (p === 'low') return '#64748b';
    return '#818cf8';
  }

  function getCategoryIcon(c: string) {
    if (c === 'technical') return '{ }';
    if (c === 'judging') return '#';
    return '?';
  }

  function formatChatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // --- Hackathon selector screen ---
  if (!selectedHackathon) {
    if (loadingHackathons) return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
      </div>
    );

    return (
      <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Mentor</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>Select a hackathon to manage your queue.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #818cf8', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Assigned Events</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#818cf8', marginTop: '0.25rem' }}>{hackathons.length}</p>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Priority</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Resolve team blockers</p>
          </div>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #3ecf8e', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Next Step</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Open an event below</p>
          </div>
        </div>

        {hackathons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No hackathons assigned yet.</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', opacity: 0.6 }}>Wait for an organiser to invite you.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
            {hackathons.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedHackathon(h)}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', padding: '1.25rem', cursor: 'pointer',
                  textAlign: 'left', transition: 'border-color 0.2s', color: 'inherit',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{h.title}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span className={`org-badge ${h.status === 'ONGOING' ? 'org-badge-success' : 'org-badge-muted'}`}>{h.status}</span>
                  <span className="org-badge org-badge-muted">
                    {new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <span className="org-btn-primary" style={{ width: '100%', justifyContent: 'center', display: 'inline-flex' }}>
                  Open Mentoring Panel
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Workspace screen (scoped to selected hackathon) ---
  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header with back button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <button
            onClick={() => { setSelectedHackathon(null); setTickets([]); setAssignedTeams([]); setChatMessages([]); }}
            style={{
              background: 'transparent', border: 'none', color: 'var(--accent)',
              fontSize: '0.72rem', cursor: 'pointer', padding: 0, marginBottom: '0.4rem',
              fontFamily: 'var(--font-display)', letterSpacing: '0.05em',
            }}
          >
            &larr; All Events
          </button>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>
            Mentor
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {selectedHackathon.title}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Queue:</span>
          <span style={{
            padding: '0.25rem 0.6rem', borderRadius: 999,
            background: 'rgba(232, 164, 74, 0.12)', color: 'var(--accent)',
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 600,
          }}>
            {openQueue.length} open
          </span>
          <span style={{
            padding: '0.25rem 0.6rem', borderRadius: 999,
            background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8',
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 600,
          }}>
            {inProgress.length} active
          </span>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem',
          fontSize: '0.82rem', fontWeight: 500,
          background: noticeType === 'success' ? 'rgba(62, 207, 142, 0.1)' : 'var(--error-dim)',
          border: `1px solid ${noticeType === 'success' ? 'var(--success)' : 'var(--error)'}`,
          color: noticeType === 'success' ? 'var(--success)' : 'var(--error)',
        }}>
          {notice}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Open Tickets</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)', marginTop: '0.25rem' }}>{openQueue.length}</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #818cf8', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>In Progress</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#818cf8', marginTop: '0.25rem' }}>{inProgress.length}</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #3ecf8e', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>My Teams</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: '#3ecf8e', marginTop: '0.25rem' }}>{assignedTeams.length}</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            Filter by category
          </label>
          <select className="org-input" value={category} onChange={(e) => setCategory(e.target.value)} style={{ minWidth: 160 }}>
            <option value="">All categories</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
            <option value="judging">Judging</option>
          </select>
        </div>
      </div>

      {/* Three Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        {/* Open Queue */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Open Queue</p>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{openQueue.length} tickets</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 500, overflowY: 'auto' }}>
            {openQueue.map((t) => {
              const pc = getPriorityColor(t.priority);
              return (
                <div key={t.id} style={{
                  padding: '0.85rem', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.6rem', fontFamily: 'monospace',
                        padding: '0.15rem 0.35rem', borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                      }}>
                        {getCategoryIcon(t.category)}
                      </span>
                      <span style={{
                        fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                        padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-sm)',
                        background: `${pc}15`, color: pc,
                      }}>
                        {t.priority}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{timeSince(t.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{t.title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {t.creator?.name || 'Unknown'}
                    </span>
                    <button
                      className="org-btn-primary"
                      onClick={() => claim(t.id)}
                      disabled={claiming === t.id}
                      style={{ fontSize: '0.68rem', padding: '0.3rem 0.65rem' }}
                    >
                      {claiming === t.id ? 'Claiming...' : 'Claim'}
                    </button>
                  </div>
                </div>
              );
            })}
            {openQueue.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No open tickets</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', opacity: 0.6 }}>New requests will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>In Progress</p>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{inProgress.length} active</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 500, overflowY: 'auto' }}>
            {inProgress.map((t) => {
              const isActive = activeTicketId === t.id || !activeTicketId;
              return (
                <div key={t.id} style={{
                  padding: '0.85rem',
                  border: `1px solid ${isActive ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'var(--accent-dim)' : 'var(--bg-raised)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                      padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(129, 140, 248, 0.12)', color: '#818cf8',
                    }}>
                      In Progress
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{timeSince(t.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{t.title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{t.description}</p>

                  {isActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <textarea
                        className="org-input"
                        placeholder="Write your resolution notes..."
                        value={activeTicketId === t.id ? resolution : ''}
                        onChange={(e) => {
                          setActiveTicketId(t.id);
                          setResolution(e.target.value);
                        }}
                        style={{ minHeight: 60, fontSize: '0.78rem', resize: 'vertical' as const }}
                      />
                      <button
                        className="org-btn-primary"
                        onClick={() => resolveTicket(t.id)}
                        disabled={resolving}
                        style={{ width: '100%', fontSize: '0.75rem' }}
                      >
                        {resolving ? 'Resolving...' : 'Resolve Ticket'}
                      </button>
                    </div>
                  )}

                  {!isActive && (
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Claimed by {t.assignedTo?.name || 'another mentor'}
                    </p>
                  )}
                </div>
              );
            })}
            {inProgress.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No active tickets</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', opacity: 0.6 }}>Claim a ticket from the queue</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Teams & Resolved */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Assigned Teams */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              My Teams
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 240, overflowY: 'auto' }}>
              {assignedTeams.map((entry) => {
                const teamSkills = [
                  ...new Set([
                    ...(entry.team?.members?.flatMap((m) => m.user?.profile?.skills || []) || []),
                    ...(entry.team?.submission?.technologies || []),
                  ]),
                ];
                const isSelected = entry.team?.id === selectedTeamId;
                return (
                  <div key={entry.team?.id} style={{
                    padding: '0.75rem',
                    border: `1px solid ${isSelected ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--accent-dim)' : 'var(--bg-raised)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedTeamId(entry.team?.id || '')}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          color: 'var(--text-primary)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        {entry.team?.name || 'Team'}
                      </button>
                      <Link
                        href={`/mentor/teams/${entry.team?.id}/chat`}
                        style={{ fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        Full Chat &rarr;
                      </Link>
                    </div>
                    {teamSkills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {teamSkills.slice(0, 5).map((skill) => (
                          <span key={skill} style={{
                            fontSize: '0.58rem', padding: '0.1rem 0.3rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontWeight: 500,
                          }}>
                            {skill}
                          </span>
                        ))}
                        {teamSkills.length > 5 && (
                          <span style={{
                            fontSize: '0.58rem', padding: '0.1rem 0.3rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-elevated)', color: 'var(--text-muted)',
                          }}>
                            +{teamSkills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {assignedTeams.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No teams assigned yet</p>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Team Chat
                </p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {selectedTeam?.team?.name || 'Select team'}
                </p>
              </div>
              <button
                className="org-btn-secondary"
                onClick={() => loadChat({ refreshing: true })}
                disabled={chatRefreshing || !selectedTeamId}
                style={{ fontSize: '0.68rem', padding: '0.3rem 0.65rem' }}
              >
                {chatRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {chatError && (
              <div style={{
                padding: '0.55rem 0.7rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '0.75rem',
                fontSize: '0.72rem',
                background: 'var(--error-dim)',
                color: 'var(--error)',
                border: '1px solid var(--error)',
              }}>
                {chatError}
              </div>
            )}

            <div style={{
              minHeight: 260,
              maxHeight: 320,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              padding: '0.2rem 0.1rem 0.8rem',
            }}>
              {!selectedTeamId ? (
                <div style={{ display: 'grid', placeItems: 'center', minHeight: 220, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No team assigned yet.
                </div>
              ) : chatLoading && chatMessages.length === 0 ? (
                <div style={{ display: 'grid', placeItems: 'center', minHeight: 220, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Loading conversation...
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ display: 'grid', placeItems: 'center', minHeight: 220, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No messages yet.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMentor = msg.isFromMentor;
                  const senderName = isMentor ? msg.mentor?.name || 'Mentor' : msg.user?.name || 'Team';
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMentor ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '88%',
                        borderRadius: 14,
                        padding: '0.62rem 0.75rem',
                        background: isMentor ? 'var(--accent)' : 'var(--bg-raised)',
                        color: isMentor ? 'var(--text-inverse)' : 'var(--text-primary)',
                        border: isMentor ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                      }}>
                        <p style={{ fontSize: '0.63rem', opacity: 0.8, marginBottom: '0.22rem' }}>{senderName}</p>
                        <p style={{ fontSize: '0.78rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                        <p style={{ fontSize: '0.6rem', opacity: 0.75, marginTop: '0.24rem' }}>{formatChatTime(msg.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <textarea
                className="org-input"
                placeholder={selectedTeamId ? 'Reply to team...' : 'Select a team to chat'}
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
                style={{ resize: 'vertical' as const, minHeight: 84 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Replies go straight to team conversation.
                </p>
                <button
                  className="org-btn-primary"
                  onClick={sendChatMessage}
                  disabled={!selectedTeamId || chatSending || !chatContent.trim()}
                  style={{ fontSize: '0.72rem', padding: '0.38rem 0.8rem' }}
                >
                  {chatSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          {/* Recently Resolved */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Recently Resolved
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: 200, overflowY: 'auto' }}>
              {resolved.map((t) => (
                <div key={t.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.6rem', border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)', background: 'var(--bg-raised)',
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{t.resolvedAt ? timeSince(t.resolvedAt) : ''}</p>
                  </div>
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                    padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(62, 207, 142, 0.12)', color: '#3ecf8e',
                    flexShrink: 0, marginLeft: '0.5rem',
                  }}>
                    DONE
                  </span>
                </div>
              ))}
              {resolved.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No resolved tickets yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
