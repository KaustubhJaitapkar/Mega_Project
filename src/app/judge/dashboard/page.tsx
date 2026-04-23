'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Hackathon { id: string; title: string; status: string; startDate: string; endDate: string }

export default function JudgeDashboardPage() {
  const { data: session } = useSession();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [progress, setProgress] = useState<Record<string, { scored: number; pending: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const role = (session?.user as any)?.role || 'JUDGE';
  const isMentor = role === 'MENTOR';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hackathons');
        const list = (await res.json()).data || [];
        setHackathons(list);
        if (!isMentor) {
          const entries = await Promise.all(list.map(async (h: Hackathon) => {
            const r = await fetch(`/api/judge/teams?hackathonId=${h.id}`);
            const d = await r.json();
            return [h.id, { scored: d.data?.scored || 0, pending: d.data?.pending || 0 }] as const;
          }));
          setProgress(Object.fromEntries(entries));
        }
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>{role}</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isMentor ? 'Mentor Dashboard' : 'Judge Dashboard'}
          </h1>
          <p className="org-text" style={{ marginTop: '0.35rem' }}>{isMentor ? 'Guide teams and support evaluation quality.' : 'Review projects and submit fair scores.'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #818cf8', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <p className="org-label">{isMentor ? 'Assigned Events' : 'Judging Events'}</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: '#818cf8' }}>{hackathons.length}</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <p className="org-label">Priority</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{isMentor ? 'Resolve team blockers' : 'Score all pending submissions'}</p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid #3ecf8e', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem' }}>
          <p className="org-label">Next Step</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Open an event below</p>
        </div>
      </div>

      {hackathons.length === 0 ? (
        <div className="org-empty" style={{ padding: '3rem' }}>No events assigned yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {hackathons.map((h) => (
            <Link key={h.id} href={isMentor ? '/mentor/dashboard' : `/judging/${h.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)', padding: '1.25rem', transition: 'border-color 0.2s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{h.title}</h3>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <span className={`org-badge ${h.status === 'ONGOING' ? 'org-badge-success' : 'org-badge-muted'}`}>{h.status}</span>
                  <span className="org-badge org-badge-muted">
                    {new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2013 {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  {!isMentor && progress[h.id] && (
                    <span className="org-badge org-badge-info">{progress[h.id].scored} scored / {progress[h.id].pending} pending</span>
                  )}
                </div>
                <span className="org-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  {isMentor ? 'Open Mentoring Panel' : 'Start Judging'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
