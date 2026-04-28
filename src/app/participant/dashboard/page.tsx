'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Hackathon {
  id: string; title: string; description: string; status: string;
  startDate: string; endDate: string; location?: string; isVirtual: boolean;
  submissionDeadline: string; registrationDeadline: string;
  timelines?: Array<{ id: string; title: string; startTime: string; endTime: string }>;
}

export default function ParticipantDashboardPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [activeHackathon, setActiveHackathon] = useState<Hackathon | null>(null);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [myAttendance, setMyAttendance] = useState<{ checkInTime: string | null; breakfastRedeemed: boolean; lunchRedeemed: boolean; swagCollected: boolean } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [hackRes, regRes] = await Promise.all([
          fetch('/api/hackathons?limit=50'),
          fetch('/api/users/registrations'),
        ]);
        const list = (await hackRes.json()).data || [];
        const ids = (await regRes.json()).data || [];
        setHackathons(list);
        setRegisteredIds(ids);
        const registered = list.filter((h: Hackathon) => ids.includes(h.id));
        setActiveHackathon(
          registered.find((h: Hackathon) => h.status === 'ONGOING') ||
          registered.find((h: Hackathon) => h.status === 'REGISTRATION') || registered[0] || null
        );
      } catch {
        setLoadError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!activeHackathon) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${activeHackathon.id}/announcements`);
        setAnnouncements(((await res.json()).data || []).slice(0, 3));
      } catch {
        // Announcements are non-critical; fail silently
      }
    })();
  }, [activeHackathon]);

  useEffect(() => {
    if (!activeHackathon) return;
    setQrLoading(true);
    setQrError('');
    (async () => {
      try {
        const [qrRes, profileRes] = await Promise.all([
          fetch(`/api/user/qr?hackathonId=${activeHackathon.id}`),
          fetch('/api/users/profile'),
        ]);
        const qrData = await qrRes.json();
        if (qrData.data?.qrCode) setQrCode(qrData.data.qrCode);
        const profile = await profileRes.json();
        const userId = profile.user?.id;
        if (userId) {
          const attRes = await fetch(`/api/hackathons/${activeHackathon.id}/attendance`);
          const attData = await attRes.json();
          const myAtt = (attData.data || []).find((a: any) => a.user?.id === userId);
          if (myAtt) setMyAttendance(myAtt);
        }
      } catch {
        setQrError('Could not load check-in status. Please refresh.');
      } finally {
        setQrLoading(false);
      }
    })();
  }, [activeHackathon]);

  const target = activeHackathon ? new Date(activeHackathon.status === 'REGISTRATION' ? activeHackathon.registrationDeadline : activeHackathon.submissionDeadline).getTime() : 0;
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const nextEvent = activeHackathon?.timelines?.find((ev) => new Date(ev.startTime).getTime() > now);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
    </div>;
  }

  if (loadError) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <p style={{ color: '#f87171', marginBottom: '1rem' }}>{loadError}</p>
      <button className="org-btn-primary" onClick={() => window.location.reload()}>Retry</button>
    </div>;
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>
            Participant
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
        </div>
        <Link href="/participant/hackathons" className="org-btn-primary">Explore Events</Link>
      </div>

      {/* Active Hackathon Hero */}
      {activeHackathon && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.25rem',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span className={`org-badge ${activeHackathon.status === 'ONGOING' ? 'org-badge-success' : 'org-badge-accent'}`}>{activeHackathon.status}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{activeHackathon.isVirtual ? 'Virtual' : activeHackathon.location || 'Venue TBA'}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{activeHackathon.title}</h2>
            <p className="org-text" style={{ marginBottom: '1rem', maxWidth: 500 }}>{activeHackathon.description}</p>

            {/* Countdown */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
              {[{ v: h, l: 'Hours' }, { v: m, l: 'Min' }, { v: s, l: 'Sec' }].map((t) => (
                <div key={t.l}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{String(t.v).padStart(2, '0')}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{t.l}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link href={`/participant/my-team?hackathonId=${activeHackathon.id}`} className="org-btn-primary">My Team</Link>
              <Link href="/participant/submit" className="org-btn-secondary">Submit</Link>
              <Link href="/participant/schedule" className="org-btn-secondary">Schedule</Link>
            </div>
          </div>

          {/* QR Code + Attendance Status */}
          {registeredIds.includes(activeHackathon.id) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              {qrLoading ? (
                <div style={{ width: 120, height: 120, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                </div>
              ) : qrError ? (
                <div style={{ width: 120, height: 120, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', color: '#f87171', textAlign: 'center', padding: '0.5rem' }}>
                  {qrError}
                </div>
              ) : qrCode ? (
                <img src={qrCode} alt="Check-in QR" style={{ width: 120, height: 120, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }} />
              ) : (
                <div style={{ width: 120, height: 120, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                  QR not available
                </div>
              )}
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textAlign: 'center' }}>CHECK-IN QR</p>

              {/* Attendance Status */}
              {myAttendance && (
                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.3rem', marginTop: '0.25rem' }}>
                  {[
                    { label: 'Check-in', done: !!myAttendance.checkInTime, color: '#3ecf8e' },
                    { label: 'Breakfast', done: myAttendance.breakfastRedeemed, color: '#f59e0b' },
                    { label: 'Lunch', done: myAttendance.lunchRedeemed, color: '#e8a44a' },
                    { label: 'Swag', done: myAttendance.swagCollected, color: '#818cf8' },
                  ].map((item) => (
                    <div key={item.label} style={{
                      display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.5rem',
                      background: item.done ? `${item.color}10` : 'var(--bg-raised)',
                      border: `1px solid ${item.done ? `${item.color}30` : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.done ? item.color : 'var(--text-muted)' }}>
                        {item.done ? '\u2713' : '\u2014'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: item.done ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Timeline + Announcements */}
      {activeHackathon && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Timeline */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p className="org-label" style={{ marginBottom: '0.75rem' }}>Timeline</p>
            {(activeHackathon.timelines || []).slice(0, 5).map((ev) => {
              const isCurrent = new Date(ev.startTime).getTime() <= now && new Date(ev.endTime).getTime() >= now;
              const isNext = !isCurrent && nextEvent?.id === ev.id;
              return (
                <div key={ev.id} style={{
                  padding: '0.6rem 0.85rem', marginBottom: '0.4rem', borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${isCurrent ? '#3ecf8e' : isNext ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  background: isCurrent ? 'rgba(62,207,142,0.06)' : isNext ? 'var(--accent-dim)' : 'transparent',
                }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{ev.title}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(ev.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              );
            })}
            {(!activeHackathon.timelines || activeHackathon.timelines.length === 0) && (
              <p className="org-text">No timeline events yet.</p>
            )}
          </div>

          {/* Announcements */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p className="org-label" style={{ marginBottom: '0.75rem' }}>Announcements</p>
            {announcements.map((a) => (
              <div key={a.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.title}</p>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="org-text">No announcements yet.</p>}
          </div>
        </div>
      )}

      {/* Registered Hackathons */}
      <div>
        <p className="org-label" style={{ marginBottom: '0.75rem' }}>Your Hackathons ({registeredIds.length})</p>
        {registeredIds.length === 0 ? (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center' }}>
            <p className="org-text" style={{ marginBottom: '1rem' }}>You have not registered for any hackathons yet.</p>
            <Link href="/participant/hackathons" className="org-btn-primary">Browse Hackathons</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
            {hackathons.filter((h) => registeredIds.includes(h.id)).map((h) => (
              <div key={h.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</h3>
                  <span className={`org-badge ${h.status === 'ONGOING' ? 'org-badge-success' : h.status === 'REGISTRATION' ? 'org-badge-accent' : 'org-badge-muted'}`}>{h.status}</span>
                </div>
                <p className="org-text" style={{ fontSize: '0.78rem', marginBottom: '0.75rem' }}>
                  {new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' '}&middot; {h.isVirtual ? 'Virtual' : h.location || 'TBA'}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link href={`/participant/my-team?hackathonId=${h.id}`} className="org-btn-primary" style={{ fontSize: '0.68rem' }}>Team</Link>
                  <Link href="/participant/submit" className="org-btn-secondary" style={{ fontSize: '0.68rem' }}>Submit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
