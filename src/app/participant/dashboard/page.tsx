'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowUpRight,
  Bell,
  Calendar,
  CalendarDays,
  ExternalLink,
  FileUp,
  LayoutGrid,
  MapPin,
  QrCode,
  Radio,
  Users,
  Award,
  UserCircle,
} from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  submissionDeadline: string;
  registrationDeadline: string;
  timelines?: Array<{ id: string; title: string; startTime: string; endTime: string }>;
}

function statusBadge(status: string): { label: string; className: string } {
  const s = (status || '').toUpperCase();
  if (s === 'ONGOING') return { label: 'Live', className: 'org-badge org-badge-success' };
  if (s === 'REGISTRATION') return { label: 'Registration open', className: 'org-badge org-badge-accent' };
  if (s === 'ENDED') return { label: 'Ended', className: 'org-badge org-badge-muted' };
  if (s === 'CANCELLED') return { label: 'Cancelled', className: 'org-badge org-badge-danger' };
  return { label: s || 'Draft', className: 'org-badge org-badge-info' };
}

const NAV_LINKS = [
  { href: '/participant/hackathons', label: 'Explore' },
  { href: '/participant/schedule', label: 'Schedule' },
  { href: '/participant/certificates', label: 'Certificates' },
  { href: '/participant/profile', label: 'Profile' },
] as const;

export default function ParticipantDashboardPage() {
  const { data: session } = useSession();
  const firstName =
    (session?.user as { name?: string } | undefined)?.name?.split(/\s+/)[0] ?? 'there';

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
  const [myAttendance, setMyAttendance] = useState<{
    checkInTime: string | null;
    breakfastRedeemed: boolean;
    lunchRedeemed: boolean;
    swagCollected: boolean;
  } | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      try {
        const [hackRes, regRes] = await Promise.all([
          fetch('/api/hackathons?limit=50', { signal: abort.signal }),
          fetch('/api/users/registrations', { signal: abort.signal }),
        ]);
        const list = (await hackRes.json()).data || [];
        const ids = (await regRes.json()).data || [];
        setHackathons(list);
        setRegisteredIds(ids);
        const registered = list.filter((h: Hackathon) => ids.includes(h.id));
        setActiveHackathon(
          registered.find((h: Hackathon) => h.status === 'ONGOING') ||
            registered.find((h: Hackathon) => h.status === 'REGISTRATION') ||
            registered[0] ||
            null
        );
      } catch (e: unknown) {
        if ((e as { name?: string })?.name !== 'AbortError') {
          setLoadError('Failed to load dashboard data. Please refresh the page.');
        }
      } finally {
        if (!abort.signal.aborted) setIsLoading(false);
      }
    })();
    return () => abort.abort();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!activeHackathon) return;
    const abort = new AbortController();
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${activeHackathon.id}/announcements`, { signal: abort.signal });
        if (!abort.signal.aborted) {
          setAnnouncements(((await res.json()).data || []).slice(0, 6));
        }
      } catch {
        /* non-critical */
      }
    })();
    return () => abort.abort();
  }, [activeHackathon]);

  useEffect(() => {
    if (!activeHackathon) return;
    const abort = new AbortController();
    setQrLoading(true);
    setQrError('');
    (async () => {
      try {
        const [qrRes, profileRes] = await Promise.all([
          fetch(`/api/user/qr?hackathonId=${activeHackathon.id}`, { signal: abort.signal }),
          fetch('/api/users/profile', { signal: abort.signal }),
        ]);
        const qrData = await qrRes.json();
        if (qrData.data?.qrCode && !abort.signal.aborted) setQrCode(qrData.data.qrCode);
        const profile = await profileRes.json();
        const userId = profile.user?.id;
        if (userId && !abort.signal.aborted) {
          const attRes = await fetch(`/api/hackathons/${activeHackathon.id}/attendance`, { signal: abort.signal });
          const attData = await attRes.json();
          const myAtt = (attData.data || []).find((a: { user?: { id: string } }) => a.user?.id === userId);
          if (myAtt && !abort.signal.aborted) setMyAttendance(myAtt);
        }
      } catch (e: unknown) {
        if ((e as { name?: string })?.name !== 'AbortError') {
          setQrError('Could not load check-in status. Please refresh.');
        }
      } finally {
        if (!abort.signal.aborted) setQrLoading(false);
      }
    })();
    return () => abort.abort();
  }, [activeHackathon]);

  const target = activeHackathon
    ? new Date(
        activeHackathon.status === 'REGISTRATION'
          ? activeHackathon.registrationDeadline
          : activeHackathon.submissionDeadline
      ).getTime()
    : 0;
  const diff = Math.max(0, target - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const countdownLabel =
    activeHackathon?.status === 'REGISTRATION' ? 'Registration closes in' : 'Submissions close in';

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 font-sans">
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

  if (loadError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center font-sans">
        <p className="max-w-md text-[15px] text-[var(--text-primary)]">{loadError}</p>
        <button type="button" className="org-btn-primary min-h-[40px] px-5" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  const registeredList = hackathons.filter((h) => registeredIds.includes(h.id));
  const activeTone = activeHackathon ? statusBadge(activeHackathon.status) : null;
  const myTeamHref = activeHackathon
    ? `/participant/my-team?hackathonId=${activeHackathon.id}`
    : '/participant/my-team';

  return (
    <div className="font-sans text-[var(--text-primary)]">
      {/* Workspace chrome — horizontal band + inline nav (structure differs from previous masthead + spotlight) */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 lg:max-w-[62%]">
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Participant workspace</p>
            <h1 className="mt-1 text-[clamp(1.35rem,2.4vw,1.75rem)] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
              {firstName === 'there' ? 'Your dashboard' : `${firstName}, here’s your overview`}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Your focused event, check-in, and every registration you have—one place.
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--border-default)] pt-4 font-mono text-[12px] lg:border-t-0 lg:pt-0"
            aria-label="Participant shortcuts"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)] hover:underline"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={myTeamHref}
              className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]"
            >
              My team
              <ArrowUpRight className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 lg:grid-cols-12 lg:gap-10 lg:px-6 lg:py-10">
        {/* Main column — stacked panels (no clipped polygon hero + rotated QR rail) */}
        <div className="flex min-w-0 flex-col gap-8 lg:col-span-8">
          {activeHackathon && activeTone ? (
            <>
              <section
                className="overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--elevation-sm)]"
                aria-labelledby="active-event-heading"
              >
                <div className="flex flex-col divide-y divide-[var(--border-default)]">
                  <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span id="active-event-heading" className={activeTone.className}>
                          {activeTone.label}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-muted)]">
                          {activeHackathon.isVirtual ? (
                            <>
                              <Radio className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
                              Virtual
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden />
                              {activeHackathon.location || 'Venue TBA'}
                            </>
                          )}
                        </span>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-[var(--text-primary)] sm:text-2xl">
                        {activeHackathon.title}
                      </h2>
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
                        {activeHackathon.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 bg-[var(--bg-root)] p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-6">
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                        {countdownLabel}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { v: h, l: 'Hr' },
                          { v: m, l: 'Min' },
                          { v: s, l: 'Sec' },
                        ].map((unit) => (
                          <div
                            key={unit.l}
                            className="flex min-w-[4.5rem] flex-col rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-center shadow-[var(--elevation-sm)]"
                          >
                            <span className="font-mono text-[clamp(1.5rem,4vw,2rem)] font-semibold tabular-nums leading-none text-[var(--text-primary)]">
                              {String(unit.v).padStart(2, '0')}
                            </span>
                            <span className="mt-1 font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                              {unit.l}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 p-5 sm:p-6">
                    <Link href={myTeamHref} className="org-btn-secondary inline-flex min-h-[40px] items-center gap-2">
                      <Users className="h-4 w-4" aria-hidden />
                      My team
                    </Link>
                    {activeHackathon.status === 'ONGOING' && (
                      <Link
                        href={`/participant/hackathons/${activeHackathon.id}/submit`}
                        className="org-btn-primary inline-flex min-h-[40px] items-center gap-2"
                      >
                        <FileUp className="h-4 w-4" aria-hidden />
                        Submit project
                      </Link>
                    )}
                    <Link
                      href={`/participant/hackathons/${activeHackathon.id}`}
                      className="org-btn-secondary inline-flex min-h-[40px] items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      Event page
                    </Link>
                    <Link
                      href="/participant/schedule"
                      className="org-btn-secondary inline-flex min-h-[40px] items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" aria-hidden />
                      Schedule
                    </Link>
                  </div>
                </div>
              </section>

              <section aria-labelledby="updates-heading">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                    <h3 id="updates-heading" className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                      Organizer updates
                    </h3>
                  </div>
                </div>
                <ul className="overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--elevation-sm)]">
                  {announcements.length === 0 ? (
                    <li className="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
                      No announcements yet.
                    </li>
                  ) : (
                    announcements.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-col gap-1 border-b border-[var(--border-default)] px-4 py-4 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                      >
                        <p className="min-w-0 font-medium text-[var(--text-primary)]">{a.title}</p>
                        <time
                          className="shrink-0 font-mono text-[12px] text-[var(--text-muted)]"
                          dateTime={a.createdAt}
                        >
                          {new Date(a.createdAt).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </>
          ) : (
            <section className="rounded-[6px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-12 text-center shadow-[var(--elevation-sm)]">
              <LayoutGrid className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" aria-hidden />
              <p className="text-[15px] font-medium text-[var(--text-primary)]">No active event pinned</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                Join a hackathon from Explore to see deadlines and check-in tools here.
              </p>
              <Link href="/participant/hackathons" className="org-btn-primary mt-6 inline-flex min-h-[40px] items-center gap-2">
                Explore hackathons
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </section>
          )}
        </div>

        {/* Sidebar — sticky identity rail (replaces offset / rotated QR card) */}
        <aside className="lg:col-span-4">
          <div className="flex flex-col gap-6 lg:sticky lg:top-6">
            <section className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
              <h3 className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Quick paths</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href="/participant/hackathons"
                    className="flex items-center justify-between gap-2 rounded-[6px] border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-root)]"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                      Explore events
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  </Link>
                </li>
                <li>
                  <Link
                    href={myTeamHref}
                    className="flex items-center justify-between gap-2 rounded-[6px] border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-root)]"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                      My team
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/participant/certificates"
                    className="flex items-center justify-between gap-2 rounded-[6px] border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-root)]"
                  >
                    <span className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                      Certificates
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/participant/profile"
                    className="flex items-center justify-between gap-2 rounded-[6px] border border-transparent px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-root)]"
                  >
                    <span className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                      Profile
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                  </Link>
                </li>
              </ul>
            </section>

            {activeHackathon && registeredIds.includes(activeHackathon.id) && (
              <section
                className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--elevation-sm)]"
                aria-labelledby="qr-heading"
              >
                <div className="mb-4 flex items-center gap-2 border-b border-[var(--border-default)] pb-4">
                  <QrCode className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                  <h3 id="qr-heading" className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                    Check-in QR
                  </h3>
                </div>
                {qrLoading ? (
                  <div className="flex aspect-square max-h-[220px] items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)]">
                    <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]" />
                  </div>
                ) : qrError ? (
                  <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--error-dim)] px-3 py-4 text-center text-sm text-[var(--error)]">
                    {qrError}
                  </div>
                ) : qrCode ? (
                  // eslint-disable-next-line @next/next/no-img-element -- dynamic QR data URL
                  <img
                    src={qrCode}
                    alt="Your check-in QR code"
                    className="mx-auto h-auto w-full max-w-[220px] rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-2 shadow-[var(--elevation-sm)]"
                  />
                ) : (
                  <p className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-3 py-8 text-center text-sm text-[var(--text-secondary)]">
                    QR not available for this event.
                  </p>
                )}

                {myAttendance && (
                  <ul className="mt-5 grid grid-cols-2 gap-2 font-mono text-[11px]" aria-label="Attendance redemption status">
                    {[
                      { label: 'Check-in', ok: !!myAttendance.checkInTime },
                      { label: 'Breakfast', ok: myAttendance.breakfastRedeemed },
                      { label: 'Lunch', ok: myAttendance.lunchRedeemed },
                      { label: 'Swag', ok: myAttendance.swagCollected },
                    ].map((row) => (
                      <li
                        key={row.label}
                        className={`flex items-center justify-between gap-2 rounded-[6px] border px-2.5 py-2 ${
                          row.ok
                            ? 'border-[var(--success)] bg-[rgba(26,127,55,0.08)] text-[var(--success)]'
                            : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                        }`}
                      >
                        <span>{row.label}</span>
                        <span aria-hidden>{row.ok ? '✓' : '—'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </aside>
      </div>

      {/* Registered events — full-width band, row list (replaces ticket grid) */}
      <div className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Registered</p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                Your hackathons
                <span className="ml-2 font-normal text-[var(--text-secondary)]">({registeredIds.length})</span>
              </h3>
            </div>
            <Link
              href="/participant/hackathons"
              className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] sm:self-auto"
            >
              Browse all
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {registeredIds.length === 0 ? (
            <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] px-6 py-14 text-center shadow-[var(--elevation-sm)]">
              <p className="mx-auto max-w-lg text-[15px] text-[var(--text-secondary)]">
                You have not joined an event yet. Open Explore to register.
              </p>
              <Link href="/participant/hackathons" className="org-btn-primary mt-6 inline-flex min-h-[40px] items-center gap-2">
                Go to Explore
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--elevation-sm)]">
              <ul className="divide-y divide-[var(--border-default)]">
                {registeredList.map((ev) => {
                  const tone = statusBadge(ev.status);
                  const start = new Date(ev.startDate);
                  const end = new Date(ev.endDate);
                  return (
                    <li key={ev.id}>
                      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
                        <div className="min-w-0 flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                          <span className={`w-fit shrink-0 ${tone.className}`}>{tone.label}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)]">{ev.title}</p>
                            <p className="mt-1 font-mono text-[12px] text-[var(--text-muted)]">
                              {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              {' — '}
                              {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              <span className="text-[var(--border-strong)]"> · </span>
                              {ev.isVirtual ? 'Virtual' : ev.location || 'Venue TBA'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 flex-wrap gap-2">
                          <Link
                            href={`/participant/my-team?hackathonId=${ev.id}`}
                            className="org-btn-secondary min-h-[36px] px-3 py-2 text-sm"
                          >
                            Team
                          </Link>
                          {ev.status === 'ONGOING' && (
                            <Link
                              href={`/participant/hackathons/${ev.id}/submit`}
                              className="org-btn-primary min-h-[36px] px-3 py-2 text-sm"
                            >
                              Submit
                            </Link>
                          )}
                          <Link
                            href={`/participant/hackathons/${ev.id}`}
                            className="org-btn-secondary min-h-[36px] px-3 py-2 text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
