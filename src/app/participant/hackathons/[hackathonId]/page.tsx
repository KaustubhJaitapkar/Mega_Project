'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  ExternalLink,
  Gift,
  LayoutList,
  Trophy,
} from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  status: string;
  shortDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  location?: string;
  isVirtual: boolean;
  prize?: string;
  prizeDetails?: Array<{ id?: string; title: string; amount?: number | string }> | string;
  rules?: string;
  maxTeamSize: number;
  minTeamSize: number;
  theme?: string;
  hostName?: string;
  eligibilityDomain?: string;
  breakfastProvided: boolean;
  lunchProvided: boolean;
  dinnerProvided: boolean;
  swagProvided: boolean;
  sponsorDetails?: any;
  judgeDetails?: any;
  organiser: { id: string; name: string; email: string };
  timelines: Array<{ id: string; title: string; description?: string | null; startTime: string; endTime: string; type: string }>;
  _count?: { teams: number; submissions: number; attendances: number };
}

const TABS = [
  { id: 'Overview', label: 'Overview', icon: LayoutList },
  { id: 'Timeline', label: 'Timeline', icon: Calendar },
  { id: 'Prizes', label: 'Prizes', icon: Gift },
  { id: 'Rules', label: 'Rules', icon: ClipboardList },
  { id: 'Results', label: 'Results', icon: Trophy },
] as const;

function stripRichText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatPrizeAmount(amount?: number | string) {
  if (amount === undefined || amount === null || amount === '') return '';
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return String(amount);
}

function normalizePrizeDetails(value?: Hackathon['prizeDetails']) {
  if (!value) return [] as Array<{ id?: string; title: string; amount?: number | string }>;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

interface Ranking {
  teamId: string;
  teamName: string;
  rank: number;
  totalScore: number;
  judgeCount: number;
}

function ResultsSection({
  hackathonId,
  prizeDetails,
}: {
  hackathonId: string;
  prizeDetails: Array<{ id?: string; title: string; amount?: number | string }>;
}) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const rankingsRes = await fetch(`/api/hackathons/${hackathonId}/rankings`);
        const rankingsData = await rankingsRes.json();
        setRankings((rankingsData.data || []).filter((r: Ranking) => r.totalScore > 0));
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [hackathonId]);

  const getPrizeLabelForRank = (rank: number) => {
    if (prizeDetails.length > 0 && prizeDetails[rank - 1]?.title) {
      return prizeDetails[rank - 1].title;
    }
    if (rank === 1) return 'Winner';
    if (rank === 2) return 'Runner-up';
    if (rank === 3) return 'Best Project';
    return '—';
  };

  if (loading) {
    return (
      <div className="py-12 text-center font-mono text-[12px] text-[var(--text-muted)]">Loading results…</div>
    );
  }

  if (rankings.length === 0) {
    return (
      <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-12 text-center shadow-[var(--elevation-sm)]">
        <p className="text-sm text-[var(--text-secondary)]">Results will be announced after judging concludes.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
      <p className="mb-4 font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Team rankings</p>
      <ul className="flex flex-col gap-2">
        {rankings.map((entry, idx) => {
          const prizeLabel = getPrizeLabelForRank(entry.rank);
          const rankNumClass =
            idx === 0
              ? 'text-[var(--accent)]'
              : idx === 1
                ? 'text-[var(--text-secondary)]'
                : idx === 2
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--text-muted)]';
          return (
            <li
              key={entry.teamId}
              className={`flex flex-col gap-3 rounded-[6px] border bg-[var(--bg-root)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                idx === 0 ? 'border-[var(--accent)]' : 'border-[var(--border-default)]'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={`w-8 shrink-0 text-center font-mono text-lg font-bold tabular-nums ${rankNumClass}`}>
                  #{entry.rank}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{entry.teamName}</p>
                  <p className="font-mono text-[11px] text-[var(--text-muted)]">
                    {entry.judgeCount} judge{entry.judgeCount !== 1 ? 's' : ''} scored
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                {prizeLabel !== '—' && (
                  <span className="org-badge org-badge-accent text-[11px]">{prizeLabel}</span>
                )}
                <span className="font-mono text-base font-semibold tabular-nums text-[var(--accent)]">
                  {entry.totalScore.toFixed(2)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function HackathonDetailPage() {
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [isRegistered, setIsRegistered] = useState(false);
  const [unregistering, setUnregistering] = useState(false);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [hRes, rRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}/register`),
        ]);
        setHackathon((await hRes.json()).data);
        setIsRegistered(!!(await rRes.json())?.data?.registered);
      } catch {
        /* silent */
      } finally {
        setIsLoading(false);
      }
    })();
  }, [hackathonId]);

  async function unregister() {
    if (!hackathon) return;
    setUnregistering(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/register`, { method: 'DELETE' });
      if (res.ok) setIsRegistered(false);
    } finally {
      setUnregistering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 font-sans">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="px-4 py-16 text-center font-sans text-[var(--text-muted)]">Hackathon not found.</div>
    );
  }

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(hackathon.registrationDeadline).getTime() - Date.now()) / 86400000)
  );
  const meals =
    [
      hackathon.breakfastProvided && 'Breakfast',
      hackathon.lunchProvided && 'Lunch',
      hackathon.dinnerProvided && 'Dinner',
      hackathon.swagProvided && 'Swag',
    ]
      .filter(Boolean)
      .join(' · ') || 'TBA';
  const sponsors = hackathon.sponsorDetails || [];
  const prizeDetails = normalizePrizeDetails(hackathon.prizeDetails);
  const cleanedDescription = stripRichText(hackathon.shortDescription || hackathon.description);
  const rulesLines = (hackathon.rules || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const statusBadgeClass =
    hackathon.status === 'ONGOING'
      ? 'org-badge-success'
      : hackathon.status === 'REGISTRATION'
        ? 'org-badge-accent'
        : hackathon.status === 'DRAFT'
          ? 'org-badge-warning'
          : hackathon.status === 'ENDED' || hackathon.status === 'CANCELLED'
            ? 'org-badge-muted'
            : 'org-badge-info';

  const statBorders = ['border-l-[var(--accent)]', 'border-l-[var(--success)]', 'border-l-[var(--border-strong)]'];

  return (
    <div className="font-sans text-[var(--text-primary)]">
      {/* Wayfinding strip — differs from old padded title-only block */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/participant/hackathons"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Explore
          </Link>
          <span className="text-[var(--border-strong)]" aria-hidden>
            /
          </span>
          <span className="min-w-0 truncate font-mono text-[12px] text-[var(--text-muted)]">{hackathon.title}</span>
        </div>
      </div>

      {/* Banner band — separate from copy (no overlapping gradient hero) */}
      {hackathon.bannerUrl && (
        <div className="border-b border-[var(--border-default)] bg-[var(--bg-root)]">
          <div className="mx-auto max-h-[min(40vh,280px)] max-w-[1100px] overflow-hidden px-4 pt-6 sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hackathon.bannerUrl}
              alt=""
              className="h-full max-h-[280px] w-full rounded-t-[6px] border border-b-0 border-[var(--border-default)] object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 lg:items-start">
          {/* Main column — title + meta grid + tabs (not pill tabs on gradient) */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`org-badge ${statusBadgeClass}`}>
                {hackathon.status === 'DRAFT' ? 'Coming soon' : hackathon.status.replace('_', ' ')}
              </span>
              {hackathon.theme && <span className="org-badge org-badge-info">{hackathon.theme}</span>}
              <span className="org-badge org-badge-muted">
                {hackathon.isVirtual ? 'Virtual' : hackathon.location || 'In-person'}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              {hackathon.logoUrl && (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-raised)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={hackathon.logoUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-[clamp(1.35rem,2.8vw,1.85rem)] font-semibold leading-tight tracking-tight">
                  {hackathon.title}
                </h1>
                {hackathon.tagline && (
                  <p className="mt-2 text-[15px] font-medium text-[var(--accent)]">{hackathon.tagline}</p>
                )}
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  {cleanedDescription}
                </p>
              </div>
            </div>

            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-[var(--border-default)] py-6 sm:grid-cols-3">
              {[
                {
                  label: 'Dates',
                  value: `${new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
                },
                {
                  label: 'Team size',
                  value: `${hackathon.minTeamSize}–${hackathon.maxTeamSize}`,
                },
                { label: 'Prize', value: hackathon.prize || 'TBD' },
                { label: 'Host', value: hackathon.hostName || hackathon.organiser?.name || 'TBA' },
                { label: 'Meals & perks', value: meals },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">{row.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 overflow-x-auto pb-1">
              <div
                className="flex min-w-max gap-1 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--elevation-sm)]"
                role="tablist"
                aria-label="Hackathon sections"
              >
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 whitespace-nowrap rounded-[6px] px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#0969da] text-white shadow-[var(--elevation-sm)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-root)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              {activeTab === 'Overview' && (
                <div className="flex flex-col gap-6">
                  {sponsors.length > 0 && (
                    <section className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
                      <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Sponsors</p>
                      <ul className="mt-4 flex flex-wrap gap-3">
                        {sponsors.map((s: { name?: string; logoUrl?: string; tier?: string }, i: number) => (
                          <li
                            key={i}
                            className="flex items-center gap-3 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-3 py-2"
                          >
                            {s.logoUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={s.logoUrl}
                                alt={s.name ? `${s.name} logo` : ''}
                                className="h-8 w-8 rounded-[6px] object-contain"
                              />
                            )}
                            <div>
                              <p className="text-sm font-semibold">{s.name}</p>
                              {s.tier && <span className="org-badge org-badge-muted mt-1 inline-block text-[10px]">{s.tier}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Teams registered', value: hackathon._count?.teams ?? 0 },
                      { label: 'Submissions', value: hackathon._count?.submissions ?? 0 },
                      { label: 'Checked in', value: hackathon._count?.attendances ?? 0 },
                    ].map((s, i) => (
                      <div
                        key={s.label}
                        className={`rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-4 pl-4 shadow-[var(--elevation-sm)] ${statBorders[i % statBorders.length]}`}
                      >
                        <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">{s.label}</p>
                        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'Timeline' && (
                <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
                  {(hackathon.timelines || []).length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)]">Timeline will be announced soon.</p>
                  ) : (
                    <ol className="relative space-y-0 border-l border-[var(--border-default)] pl-6">
                      {(hackathon.timelines || []).map((ev) => (
                        <li key={ev.id} className="relative pb-8 last:pb-0">
                          <span className="absolute -left-[25px] mt-1.5 h-2 w-2 rounded-full bg-[var(--accent)] ring-4 ring-[var(--bg-elevated)]" />
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-6">
                            <div className="shrink-0 font-mono text-[12px] text-[var(--text-muted)]">
                              <p className="font-semibold text-[var(--accent)]">
                                {new Date(ev.startTime).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                              <p>
                                {new Date(ev.startTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                –{' '}
                                {new Date(ev.endTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-[var(--text-primary)]">{ev.title}</p>
                              {ev.description && (
                                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{ev.description}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {activeTab === 'Prizes' && (
                <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-default)] pb-4">
                    <div>
                      <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                        Total prize pool
                      </p>
                      <p className="mt-2 font-mono text-2xl font-semibold text-[var(--accent)]">
                        {hackathon.prize || 'TBD'}
                      </p>
                    </div>
                    <span className="org-badge org-badge-success">Certificates</span>
                  </div>
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Qualifying teams receive digital certificates from organizers.
                  </p>
                  {prizeDetails.length > 0 && (
                    <ul className="mt-6 space-y-2">
                      {prizeDetails.map((prize, idx) => (
                        <li
                          key={prize.id || idx}
                          className="flex items-center justify-between gap-4 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-4 py-3"
                        >
                          <span className="font-semibold text-[var(--text-primary)]">{prize.title}</span>
                          {formatPrizeAmount(prize.amount) && (
                            <span className="font-mono text-sm font-semibold text-[var(--text-secondary)]">
                              {formatPrizeAmount(prize.amount)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'Rules' && (
                <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
                  <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                    Rules & guidelines
                  </p>
                  {rulesLines.length > 0 ? (
                    <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {rulesLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-[var(--text-secondary)]">Rules will be shared by the organizers soon.</p>
                  )}
                </div>
              )}

              {activeTab === 'Results' && <ResultsSection hackathonId={hackathonId} prizeDetails={prizeDetails} />}
            </div>
          </div>

          {/* Sticky rail — registration + dates (structure: single column stack, not nested colored pills) */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
            <section className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)]">
              {hackathon.status === 'DRAFT' ? (
                <div className="text-center">
                  <span className="org-badge org-badge-warning mb-3 inline-block">Preview</span>
                  <p className="text-sm text-[var(--text-secondary)]">Registration is not open yet.</p>
                  <p className="mt-2 font-mono text-[12px] text-[var(--text-muted)]">Check back after publish.</p>
                </div>
              ) : hackathon.status === 'CANCELLED' ? (
                <div className="text-center">
                  <span className="org-badge org-badge-muted mb-3 inline-block">Cancelled</span>
                  <p className="text-sm text-[var(--text-secondary)]">This hackathon has been cancelled.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between gap-2 border-b border-[var(--border-default)] pb-4">
                    <span
                      className={`org-badge ${
                        hackathon.status === 'ONGOING'
                          ? 'org-badge-success'
                          : hackathon.status === 'REGISTRATION'
                            ? 'org-badge-accent'
                            : 'org-badge-muted'
                      }`}
                    >
                      {hackathon.status === 'REGISTRATION' ? `${daysLeft}d left to register` : hackathon.status}
                    </span>
                    <span className="font-mono text-[12px] text-[var(--text-muted)]">
                      {hackathon._count?.teams ?? 0} teams
                    </span>
                  </div>

                  {isRegistered ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/participant/my-team?hackathonId=${hackathon.id}`}
                        className="org-btn-primary flex min-h-[40px] w-full items-center justify-center no-underline"
                      >
                        My team
                      </Link>
                      {hackathon.status === 'REGISTRATION' && (
                        <Link
                          href={`/participant/hackathons/${hackathon.id}/register`}
                          className="org-btn-secondary flex min-h-[40px] w-full items-center justify-center no-underline"
                        >
                          Update registration
                        </Link>
                      )}
                      {hackathon.status === 'ONGOING' && (
                        <Link
                          href={`/participant/hackathons/${hackathon.id}/submit`}
                          className="org-btn-primary flex min-h-[40px] w-full items-center justify-center no-underline"
                        >
                          Submit project
                        </Link>
                      )}
                      {hackathon.status === 'REGISTRATION' && (
                        <button
                          type="button"
                          onClick={unregister}
                          className="org-btn-danger flex min-h-[40px] w-full items-center justify-center"
                          disabled={unregistering}
                        >
                          {unregistering ? '…' : 'Unregister'}
                        </button>
                      )}
                    </div>
                  ) : hackathon.status === 'REGISTRATION' ? (
                    <Link
                      href={`/participant/hackathons/${hackathon.id}/register`}
                      className="org-btn-primary flex min-h-[40px] w-full items-center justify-center no-underline"
                    >
                      Register
                    </Link>
                  ) : hackathon.status === 'ONGOING' ? (
                    <p className="text-center text-sm text-[var(--text-secondary)]">Registration is closed.</p>
                  ) : hackathon.status === 'ENDED' ? (
                    <p className="text-center text-sm text-[var(--text-secondary)]">This hackathon has ended.</p>
                  ) : null}
                </>
              )}
            </section>

            <section className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--elevation-sm)]">
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Key dates</p>
              <ul className="mt-3 divide-y divide-[var(--border-default)]">
                {[
                  { label: 'Registration closes', date: hackathon.registrationDeadline },
                  { label: 'Event starts', date: hackathon.startDate },
                  { label: 'Submission deadline', date: hackathon.submissionDeadline },
                  { label: 'Event ends', date: hackathon.endDate },
                ].map((d) => (
                  <li key={d.label} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                    <span className="text-sm text-[var(--text-secondary)]">{d.label}</span>
                    <time className="font-mono text-[12px] font-medium text-[var(--text-primary)]" dateTime={d.date}>
                      {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </time>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--elevation-sm)]">
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Eligibility</p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {hackathon.eligibilityDomain || 'Open to all'}
              </p>
              <div className="mt-4 border-t border-[var(--border-default)] pt-4">
                <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Organizer</p>
                <p className="mt-1 text-sm">{hackathon.organiser?.name}</p>
                <a
                  href={`mailto:${hackathon.organiser?.email}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)] hover:underline"
                >
                  Email
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
