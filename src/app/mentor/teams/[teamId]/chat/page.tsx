'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

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

export default function MentorTeamChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ teamId: string }>();
  const teamId = params?.teamId || '';

  const [teamName, setTeamName] = useState('');
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastMessageSigRef = useRef('');

  const activeMentor = useMemo(() => mentors[0], [mentors]);

  useEffect(() => {
    if (session) return;
    router.push('/login');
  }, [session, router]);

  async function loadChat() {
    if (!teamId) {
      setError('Team not selected');
      setLoading(false);
      return;
    }
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
      if (lastMessageSigRef.current !== nextSig) {
        setMessages(nextMessages);
        lastMessageSigRef.current = nextSig;
      }
      setError('');
    } catch {
      setError('Failed to load chat');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChat();
    const interval = setInterval(() => loadChat(), 10000);
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
      isFromMentor: true,
      mentor: {
        id: (session?.user as any)?.id || 'mentor',
        name: session?.user?.name || 'Mentor',
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
    } catch {
      setError('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ minHeight: '50vh' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/mentor/dashboard"
            className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Team Chat</h1>
          <p className="text-[13px] text-[var(--text-secondary)]">Team: {teamName || 'Unknown'}</p>
        </div>
      </div>

      <div className="card flex items-center justify-between p-4">
        <div>
          <p className="text-[12px] text-[var(--text-muted)]">Assigned Mentor</p>
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">
            {activeMentor ? activeMentor.name : 'No mentor assigned yet'}
          </p>
        </div>
        {activeMentor?.email && (
          <span className="text-[13px] text-[var(--text-muted)]">{activeMentor.email}</span>
        )}
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[rgba(239,68,68,0.2)] bg-[var(--error-dim)] p-4">
          <p className="text-[13px] text-[var(--error)]">{error}</p>
        </div>
      )}

      <div className="card space-y-4 p-4">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {messages.length === 0 ? (
            <p className="text-[13px] text-[var(--text-muted)]">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const isMentor = msg.isFromMentor;
              const senderName = isMentor ? msg.mentor?.name || 'Mentor' : msg.user?.name || 'Team';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMentor ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-[var(--radius-lg)] px-4 py-3 ${
                    isMentor
                      ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-default)]'
                  }`}>
                    <p className="mb-1 text-[10px] opacity-70">{senderName}</p>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.content}</p>
                    <p className="mt-2 text-[10px] opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--border-default)] pt-4">
          <textarea
            className="input"
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending && content.trim()) sendMessage();
              }
            }}
            rows={3}
          />
          <div className="flex justify-end">
            <button
              className="btn btn-primary inline-flex items-center gap-2"
              onClick={sendMessage}
              disabled={sending || !content.trim()}
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
