'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
    if (!session) {
      router.push('/login');
    }
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
      <div className="p-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Team Chat</h1>
          <p className="text-sm text-gray-600">Team: {teamName || 'Unknown'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => router.push('/mentor/dashboard')}>
          Back to Mentor Dashboard
        </button>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Assigned Mentor</p>
          <p className="font-semibold">
            {activeMentor ? activeMentor.name : 'No mentor assigned yet'}
          </p>
        </div>
        {activeMentor?.email && (
          <span className="text-sm text-gray-500">{activeMentor.email}</span>
        )}
      </div>

      {error && (
        <div className="card">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="card space-y-4">
        <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
          ) : (
            messages.map((msg) => {
              const isMentor = msg.isFromMentor;
              const senderName = isMentor ? msg.mentor?.name || 'Mentor' : msg.user?.name || 'Team';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMentor ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMentor ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                    <p className="text-xs opacity-70 mb-1">{senderName}</p>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] opacity-70 mt-2">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t pt-4 flex flex-col gap-3">
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
            <button className="btn btn-primary" onClick={sendMessage} disabled={sending || !content.trim()}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
