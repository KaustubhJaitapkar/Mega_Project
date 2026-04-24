'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Hackathon { id: string; title: string; status: string; startDate: string; endDate: string }

// Card component for hackathon with judging open check
function JudgeHackathonCard({ hackathon, isMentor, progress }: { hackathon: any, isMentor: boolean, progress: any }) {
  const [judgingOpen, setJudgingOpen] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathon.id}/judging-control`);
        const data = await res.json();
        if (mounted) setJudgingOpen(!!data.data?.judgingOpen);
      } catch { setJudgingOpen(false); }
    })();
    return () => { mounted = false; };
  }, [hackathon.id]);

  const isJudgingClosed = judgingOpen === false;
  const href = isMentor ? '/mentor/dashboard' : `/judging/${hackathon.id}`;
  const shouldDisable = isJudgingClosed && !isMentor;

  return (
    <Link href={href} style={{ textDecoration: 'none', pointerEvents: shouldDisable ? 'none' : undefined, opacity: shouldDisable ? 0.6 : 1 }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem', transition: 'border-color 0.2s',
      }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{hackathon.title}</h3>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span className={`org-badge ${hackathon.status === 'ONGOING' ? 'org-badge-success' : 'org-badge-muted'}`}>{hackathon.status}</span>
          <span className="org-badge org-badge-muted">
            {new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {!isMentor && progress && (
            <span className="org-badge org-badge-info">{progress.scored} scored / {progress.pending} pending</span>
          )}
        </div>
        <span className="org-btn-primary" style={{ width: '100%', justifyContent: 'center', background: shouldDisable ? 'var(--border-subtle)' : undefined, color: isJudgingClosed ? 'white' : 'var(--text-primary)' }}>
          {isMentor ? 'Open Mentoring Panel' : isJudgingClosed ? 'Judging Closed' : judgingOpen === null ? 'Loading...' : 'Start Judging'}
        </span>
      </div>
    </Link>
  );
}

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
        // Fetch all hackathons
        const res = await fetch('/api/hackathons');
        const list = (await res.json()).data || [];
        console.log('All hackathons:', list);
        console.log('Session user:', session?.user);
        
        // Filter only those where the judge is assigned
        const judgeId = (session?.user as any)?.id;
        console.log('Judge ID:', judgeId);
        
        const filtered = list.filter((h: any) => {
          console.log(`Hackathon ${h.title} judges:`, h.judges);
          return h.judges?.some((j: any) => j.id === judgeId);
        });
        console.log('Filtered hackathons:', filtered);
        
        setHackathons(filtered);
        if (!isMentor) {
          const entries = await Promise.all(filtered.map(async (h: Hackathon) => {
            const r = await fetch(`/api/judge/teams?hackathonId=${h.id}`);
            const d = await r.json();
            return [h.id, { scored: d.data?.scored || 0, pending: d.data?.pending || 0 }] as const;
          }));
          setProgress(Object.fromEntries(entries));
        }
      } catch (error) { 
        console.error('Error fetching hackathons:', error);
      }
      finally { setIsLoading(false); }
    })();
  }, [session, isMentor]);

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
    </div>
  );

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
            <JudgeHackathonCard key={h.id} hackathon={h} isMentor={isMentor} progress={progress[h.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
