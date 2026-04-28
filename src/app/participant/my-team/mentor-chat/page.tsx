'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Send, MessageCircle, UserRound, Mail, RefreshCw } from 'lucide-react';

interface Mentor {
  id: string;
  name: string;
  email?: string;
  image?: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isFromMentor: boolean;
  user?: { id: string; name: string; image?: string | null } | null;
  mentor?: { id: string; name: string; image?: string | null } | null;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MentorChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get('teamId') || '';
  const hackathonId = searchParams.get('hackathonId') || '';

  const [teamName, setTeamName] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastMessageSigRef = useRef('');

  const activeMentor = useMemo(() => mentors[0], [mentors]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    }
  }, [session, router]);

  async function loadChat(showRefreshing = false) {
    if (!teamId) {
      setError('Team not selected');
      setLoading(false);
      return;
    }

    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/chat`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load chat');
        return;
      }

      const nextMessages: Message[] = data.data.messages || [];
      const nextSig = nextMessages.length
        ? `${nextMessages.length}:${nextMessages[nextMessages.length - 1]?.id}`
        : '0:empty';

      setTeamName(data.data.team?.name || '');
      setMentors(data.data.mentors || []);
      if (nextSig !== lastMessageSigRef.current) {
        setMessages(nextMessages);
        lastMessageSigRef.current = nextSig;
      }
      setError('');
    } catch {
      setError('Failed to load chat');
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadChat();
    const interval = setInterval(() => loadChat(), 4000);
    return () => clearInterval(interval);
  }, [teamId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!content.trim() || !teamId) return;
    const draft = content.trim();
    const optimisticId = `optimistic-${Date.now()}`;
    const optimistic: Message = {
      id: optimisticId,
      content: draft,
      createdAt: new Date().toISOString(),
      isFromMentor: false,
      user: {
        id: (session?.user as any)?.id || 'me',
        name: session?.user?.name || 'You',
      },
    };

    setMessages((prev) => [...prev, optimistic]);
    setContent('');
    setSending(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        return;
      }
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? data.data : m)));
      setError('');
    } catch (err) {
      setError('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.75s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="org-page" style={{ maxWidth: 1160 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--accent)' }}>
            Collaboration
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            Mentor Chat
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.2rem' }}>
            Team: {teamName || 'Unknown'}{hackathonId ? ` · Hackathon ${hackathonId.slice(0, 8)}...` : ''}
          </p>
        </div>
        <button className="org-btn-secondary" onClick={() => router.push('/participant/my-team')}>
          <ArrowLeft size={15} /> Back to Team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="org-card">
            <p className="org-label" style={{ marginBottom: '0.6rem' }}>Assigned Mentor</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', color: 'var(--accent)', border: '1px solid var(--border-subtle)' }}>
                {activeMentor?.name?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {activeMentor ? activeMentor.name : 'No mentor assigned'}
                </p>
                {activeMentor?.email && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                    <Mail size={12} /> {activeMentor.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="org-card">
            <p className="org-label" style={{ marginBottom: '0.4rem' }}>Tips</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.5 }}>
              Share context, blockers, and what you already tried. It gets you faster and better help.
            </p>
          </div>
        </aside>

        <section className="org-card" style={{ padding: '0.95rem', display: 'flex', flexDirection: 'column', minHeight: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.6rem 0.8rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MessageCircle size={14} /> Conversation
            </p>
            <button className="org-btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.65rem' }} onClick={() => loadChat(true)} disabled={refreshing}>
              <RefreshCw size={12} className={refreshing ? 'hf-spin' : ''} /> Refresh
            </button>
          </div>

          {error && (
            <div className="org-feedback org-feedback-error" style={{ margin: '0.7rem 0.6rem 0' }}>{error}</div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.9rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {messages.length === 0 ? (
              <div style={{ height: '100%', minHeight: 240, display: 'grid', placeItems: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                No messages yet. Start with a clear question.
              </div>
            ) : (
              messages.map((msg) => {
                const isMentor = msg.isFromMentor;
                const senderName = isMentor ? msg.mentor?.name || 'Mentor' : msg.user?.name || 'Team';
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMentor ? 'flex-start' : 'flex-end' }}>
                    <div style={{
                      maxWidth: '78%',
                      borderRadius: 14,
                      padding: '0.68rem 0.82rem',
                      background: isMentor ? 'var(--bg-raised)' : 'var(--accent)',
                      color: isMentor ? 'var(--text-primary)' : 'var(--text-inverse)',
                      border: isMentor ? '1px solid var(--border-subtle)' : '1px solid var(--accent)',
                    }}>
                      <p style={{ fontSize: '0.66rem', opacity: 0.75, marginBottom: '0.28rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <UserRound size={11} /> {senderName}
                      </p>
                      <p style={{ fontSize: '0.84rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                      <p style={{ fontSize: '0.62rem', opacity: 0.75, marginTop: '0.3rem' }}>{formatTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '0.75rem 0.55rem 0.45rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            <textarea
              className="org-input"
              placeholder="Write a concise question or update... (Enter to send, Shift+Enter for newline)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending && content.trim()) sendMessage();
                }
              }}
              rows={3}
              style={{ resize: 'vertical', minHeight: 88 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Keep it specific: blocker, logs, and what you tried.
              </p>
              <button className="org-btn-primary" onClick={sendMessage} disabled={sending || !content.trim()}>
                <Send size={14} /> {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
    );
}
