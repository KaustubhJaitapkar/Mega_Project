'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, CalendarClock, Megaphone } from 'lucide-react';

interface TimelineEv {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  isUrgent?: boolean;
  createdAt: string;
  author?: { name?: string };
}

interface HackathonSummary {
  id: string;
  title: string;
  status?: string;
  timelines?: TimelineEv[];
}

export default function ParticipantSchedulePage() {
  const [hackathonList, setHackathonList] = useState<HackathonSummary[]>([]);
  const [hackathonId, setHackathonId] = useState('');
  const [detail, setDetail] = useState<HackathonSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const [hRes, rRes] = await Promise.all([
          fetch('/api/hackathons?limit=50'),
          fetch('/api/users/registrations'),
        ]);
        const list: HackathonSummary[] = (await hRes.json()).data || [];
        const regIds: string[] = (await rRes.json()).data || [];
        const registered = list.filter((h) => regIds.includes(h.id));
        const pool = registered.length > 0 ? registered : list;
        if (cancel) return;
        setHackathonList(pool);
        const pick =
          pool.find((h) => h.status === 'ONGOING') ||
          pool.find((h) => h.status === 'REGISTRATION') ||
          pool[0] ||
          null;
        if (pick) setHackathonId(pick.id);
        else {
          setDetail(null);
          setAnnouncements([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const refreshData = useCallback(async (id: string) => {
    if (!id) return;
    const [d, a] = await Promise.all([
      fetch(`/api/hackathons/${id}`).then((r) => r.json()),
      fetch(`/api/hackathons/${id}/announcements`).then((r) => r.json()),
    ]);
    setDetail(d.data || null);
    setAnnouncements(a.data || []);
  }, []);

  useEffect(() => {
    if (!hackathonId) return;
    refreshData(hackathonId);
    const interval = setInterval(() => {
      refreshData(hackathonId);
    }, 10000);
    return () => clearInterval(interval);
  }, [hackathonId, refreshData]);

  const timelines: TimelineEv[] = detail?.timelines || [];

  const sortedUpcoming = [...timelines]
    .filter((t) => new Date(t.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const nextId = sortedUpcoming[0]?.id;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center font-sans">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return (
    <div className="font-sans text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link
              href="/participant/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <CalendarClock className="h-6 w-6 text-[var(--accent)]" aria-hidden />
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Schedule</p>
            </div>
            <h1 className="mt-2 text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight">
              Event timeline
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Official slots and organizer announcements for the hackathon you select—live, next up, and completed states use the same tokens as the rest of the app.
            </p>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[260px]">
            <label htmlFor="schedule-hackathon" className="mb-1 block font-mono text-[12px] text-[var(--text-muted)]">
              Hackathon
            </label>
            <select
              id="schedule-hackathon"
              className="org-input h-11 w-full rounded-[6px] text-sm"
              value={hackathonId}
              onChange={(e) => setHackathonId(e.target.value)}
              disabled={hackathonList.length === 0}
            >
              {hackathonList.length === 0 ? (
                <option value="">None available</option>
              ) : (
                hackathonList.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 sm:py-10">
        {!hackathonId || !detail ? (
          <div className="rounded-[6px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-[var(--elevation-sm)]">
            <p className="text-[15px] text-[var(--text-secondary)]">
              No hackathon available yet. Register from Explore, then open Schedule again.
            </p>
            <Link
              href="/participant/hackathons"
              className="org-btn-primary mt-6 inline-flex min-h-[40px] items-center gap-2 no-underline"
            >
              Explore hackathons
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-10">
            <section aria-labelledby="timeline-heading">
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                <h2 id="timeline-heading" className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                  Timeline ({timelines.length})
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {timelines.map((ev) => {
                  const start = new Date(ev.startTime).getTime();
                  const end = new Date(ev.endTime).getTime();
                  const isCurrent = start <= now && end >= now;
                  const isPast = end < now;
                  const isNext = !isCurrent && !isPast && ev.id === nextId;

                  const stripe = isCurrent
                    ? 'border-l-[var(--success)]'
                    : isNext
                      ? 'border-l-[var(--accent)]'
                      : 'border-l-[var(--border-strong)]';
                  const bg = isCurrent
                    ? 'bg-[rgba(26,127,55,0.06)]'
                    : isNext
                      ? 'bg-[var(--accent-dim)]'
                      : 'bg-[var(--bg-elevated)]';

                  return (
                    <article
                      key={ev.id}
                      className={`rounded-[6px] border border-[var(--border-default)] border-l-4 py-4 pl-4 pr-4 shadow-[var(--elevation-sm)] ${stripe} ${bg} ${isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">{ev.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          {isCurrent && <span className="org-badge org-badge-success">Live</span>}
                          {isNext && <span className="org-badge org-badge-accent">Up next</span>}
                          {isPast && <span className="org-badge org-badge-muted">Ended</span>}
                        </div>
                      </div>
                      <p className="mt-2 font-mono text-[12px] text-[var(--text-muted)]">
                        {new Date(ev.startTime).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' · '}
                        {new Date(ev.endTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {ev.description && (
                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{ev.description}</p>
                      )}
                    </article>
                  );
                })}
                {timelines.length === 0 && (
                  <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                    No timeline published yet.
                  </div>
                )}
              </div>
            </section>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="mb-4 flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                <h2 className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                  Announcements ({announcements.length})
                </h2>
              </div>
              <ul className="flex flex-col gap-3">
                {announcements.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-[6px] border bg-[var(--bg-elevated)] p-4 shadow-[var(--elevation-sm)] ${
                      a.isUrgent ? 'border-[var(--error)]' : 'border-[var(--border-default)]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Bell className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
                      <p className="min-w-0 flex-1 font-semibold text-[var(--text-primary)]">{a.title}</p>
                      {a.isUrgent && <span className="org-badge org-badge-danger">Urgent</span>}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{a.content}</p>
                    <p className="mt-3 font-mono text-[11px] text-[var(--text-muted)]">
                      {a.author?.name ?? 'Organizer'} · {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
                {announcements.length === 0 && (
                  <li className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                    No announcements yet.
                  </li>
                )}
              </ul>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
