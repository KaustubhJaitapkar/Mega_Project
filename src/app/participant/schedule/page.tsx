'use client';

import { useEffect, useState } from 'react';

export default function ParticipantSchedulePage() {
  const [activeHackathon, setActiveHackathon] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/hackathons?limit=50');
      const list = (await res.json()).data || [];
      const active = list.find((h: any) => h.status === 'ONGOING') || list.find((h: any) => h.status === 'REGISTRATION');
      if (!active) return;
      setActiveHackathon(active);
    })();
  }, []);

  useEffect(() => {
    if (!activeHackathon) return;
    (async () => {
      const [details, ann] = await Promise.all([
        fetch(`/api/hackathons/${activeHackathon.id}`).then((r) => r.json()),
        fetch(`/api/hackathons/${activeHackathon.id}/announcements`).then((r) => r.json()),
      ]);
      setActiveHackathon(details.data);
      setAnnouncements(ann.data || []);
    })();
    const interval = setInterval(async () => {
      const [d, a] = await Promise.all([
        fetch(`/api/hackathons/${activeHackathon.id}`).then((r) => r.json()),
        fetch(`/api/hackathons/${activeHackathon.id}/announcements`).then((r) => r.json()),
      ]);
      setActiveHackathon(d.data);
      setAnnouncements(a.data || []);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeHackathon?.id]);

  const timelines = activeHackathon?.timelines || [];

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>
          {activeHackathon?.title || 'Schedule'}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Event Schedule
        </h1>
        <p className="org-text" style={{ marginTop: '0.35rem' }}>Timeline events and announcements for your active hackathon.</p>
      </div>

      {!activeHackathon ? (
        <div className="org-empty" style={{ padding: '3rem' }}>No active hackathon found. Register for one to see the schedule.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          {/* Timeline */}
          <div>
            <p className="org-label" style={{ marginBottom: '0.75rem' }}>Timeline ({timelines.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {timelines.map((ev: any) => {
                const start = new Date(ev.startTime).getTime();
                const end = new Date(ev.endTime).getTime();
                const isCurrent = start <= now && end >= now;
                const isPast = end < now;
                const isNext = !isCurrent && !isPast && timelines.filter((t: any) => new Date(t.startTime).getTime() > now).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]?.id === ev.id;
                return (
                  <div key={ev.id} style={{
                    background: 'var(--bg-surface)', border: '1px solid',
                    borderColor: isCurrent ? 'rgba(62,207,142,0.3)' : isNext ? 'rgba(232,164,74,0.3)' : 'var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
                    borderLeft: `3px solid ${isCurrent ? '#3ecf8e' : isNext ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    opacity: isPast ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{ev.title}</p>
                      {isCurrent && <span className="org-badge org-badge-success">LIVE</span>}
                      {isNext && <span className="org-badge org-badge-accent">UP NEXT</span>}
                      {isPast && <span className="org-badge org-badge-muted">DONE</span>}
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.startTime).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' \u2013 '}
                      {new Date(ev.endTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {ev.description && <p className="org-text" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>{ev.description}</p>}
                  </div>
                );
              })}
              {timelines.length === 0 && <div className="org-empty">No timeline events scheduled yet.</div>}
            </div>
          </div>

          {/* Announcements */}
          <div>
            <p className="org-label" style={{ marginBottom: '0.75rem' }}>Announcements ({announcements.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {announcements.map((a: any) => (
                <div key={a.id} style={{
                  background: 'var(--bg-surface)', border: `1px solid ${a.isUrgent ? 'rgba(239,68,68,0.25)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)', padding: '0.85rem',
                  borderLeft: a.isUrgent ? '3px solid #ef4444' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.title}</p>
                    {a.isUrgent && <span className="org-badge org-badge-danger">URGENT</span>}
                  </div>
                  <p className="org-text" style={{ fontSize: '0.78rem' }}>{a.content}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {a.author?.name} &middot; {new Date(a.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && <div className="org-empty">No announcements yet.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
