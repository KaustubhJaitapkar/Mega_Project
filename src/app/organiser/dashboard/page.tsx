'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  LayoutDashboard,
  Plus,
  QrCode,
  ExternalLink,
  Pencil,
  Users,
  FileInput,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  _count?: { teams: number; submissions: number };
}

function statusPresentation(status: string) {
  const s = (status || 'DRAFT').toUpperCase();
  const map: Record<string, { label: string; className: string }> = {
    DRAFT: {
      label: 'Draft',
      className: 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)]',
    },
    PUBLISHED: {
      label: 'Published',
      className: 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-accent)]',
    },
    REGISTRATION: {
      label: 'Registration',
      className: 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-accent)]',
    },
    ONGOING: {
      label: 'Ongoing',
      className: 'bg-[var(--success-dim)] text-[var(--success)] border-[rgba(16,185,129,0.2)]',
    },
    JUDGING: {
      label: 'Judging',
      className: 'bg-[var(--warning-dim)] text-[var(--warning)] border-[rgba(245,158,11,0.2)]',
    },
    ENDED: {
      label: 'Ended',
      className: 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)]',
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-[var(--error-dim)] text-[var(--error)] border-[rgba(239,68,68,0.2)]',
    },
  };
  return map[s] || {
    label: s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    className: 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)]',
  };
}

function formatShortRange(startDate: string, endDate: string) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`;
}

export default function OrganiserDashboardPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/hackathons?mine=true');
        const data = await res.json();
        setHackathons(data.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    fetchHackathons();
  }, []);

  const totals = useMemo(() => {
    const teams = hackathons.reduce((a, h) => a + (h._count?.teams || 0), 0);
    const submissions = hackathons.reduce((a, h) => a + (h._count?.submissions || 0), 0);
    return { teams, submissions };
  }, [hackathons]);

  const statCards = [
    {
      label: 'Hackathons',
      value: hackathons.length,
      hint: 'Events you manage',
      icon: LayoutDashboard,
    },
    {
      label: 'Teams',
      value: totals.teams,
      hint: 'Across all events',
      icon: Users,
    },
    {
      label: 'Submissions',
      value: totals.submissions,
      hint: 'Total received',
      icon: FileInput,
    },
  ];

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
        {/* Page header */}
        <header className="mb-8 flex flex-col gap-5 border-b border-[var(--border-default)] pb-6 sm:mb-10 sm:gap-6 sm:pb-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="h-[1px] w-6 bg-[var(--accent)]" />
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Organiser workspace
              </p>
            </div>
            <h1 className="font-display text-[clamp(1.5rem,2.5vw,1.85rem)] font-bold tracking-tight text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
              Review every hackathon, jump into operations for a single event, and export data when you need it offline.
            </p>
          </div>
          <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
            <Link
              href="/organiser/scan"
              className="btn btn-secondary !min-h-[40px] w-full sm:w-auto"
            >
              <QrCode className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              QR Scanner
            </Link>
            <Link
              href="/create"
              className="btn btn-primary !min-h-[40px] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Create hackathon
            </Link>
          </div>
        </header>

        {/* KPI strip */}
        <section className="mb-8 grid grid-cols-1 gap-3 sm:mb-10 sm:grid-cols-3" aria-label="Summary statistics">
          {statCards.map(({ label, value, hint, icon: Icon }) => (
            <div
              key={label}
              className="flex gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-all duration-200 hover:border-[var(--border-strong)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-root)] text-[var(--accent)]">
                <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {label}
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums tracking-tight text-[var(--text-primary)]">
                  {isLoading ? '—' : value}
                </p>
                <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{hint}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Hackathon list */}
        <section aria-labelledby="hackathons-heading">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="hackathons-heading"
                className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]"
              >
                Your hackathons
              </h2>
              <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">
                Select an event to open the command center for day-to-day operations.
              </p>
            </div>
            {!isLoading && hackathons.length > 0 && (
              <p className="font-mono text-[11px] text-[var(--text-muted)]">
                {hackathons.length} event{hackathons.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {isLoading ? (
            <div
              className="flex justify-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] py-16"
              role="status"
              aria-live="polite"
            >
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
                aria-hidden
              />
              <span className="sr-only">Loading hackathons</span>
            </div>
          ) : hackathons.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-root)] text-[var(--text-muted)]">
                <LayoutDashboard className="h-6 w-6" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="mb-1 font-display text-base font-bold text-[var(--text-primary)]">
                No hackathons yet
              </p>
              <p className="mb-6 text-[13px] text-[var(--text-secondary)]">
                Create an event to enable registration, teams, submissions, and judging.
              </p>
              <Link
                href="/create"
                className="btn btn-primary mx-auto inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Create your first hackathon
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] md:block md:overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px] lg:min-w-0">
                  <thead>
                    <tr className="border-b border-[var(--border-default)]">
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-secondary)]">
                        Event
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-secondary)]">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-secondary)] tabular-nums">
                        Teams
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-secondary)] tabular-nums">
                        Submissions
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-secondary)]">
                        Schedule
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-[var(--text-secondary)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hackathons.map((h) => {
                      const st = statusPresentation(h.status);
                      return (
                        <tr
                          key={h.id}
                          className="border-b border-[var(--border-subtle)] last:border-b-0 transition-colors hover:bg-[var(--bg-raised)]"
                        >
                          <td className="max-w-[280px] px-4 py-3.5 align-middle">
                            <span className="font-semibold text-[var(--text-primary)]">{h.title}</span>
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <span
                              className={`inline-flex rounded-[var(--radius-full)] border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${st.className}`}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle tabular-nums text-[var(--text-primary)]">
                            {h._count?.teams ?? 0}
                          </td>
                          <td className="px-4 py-3.5 align-middle tabular-nums text-[var(--text-primary)]">
                            {h._count?.submissions ?? 0}
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-secondary)]">
                              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                              {formatShortRange(h.startDate, h.endDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Link
                                href={`/organiser/command-center/${h.id}`}
                                className="btn btn-primary !min-h-[32px] !px-3 !py-1 !text-[12px]"
                              >
                                Open
                                <ArrowRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
                              </Link>
                              <Link
                                href={`/organiser/edit/${h.id}`}
                                className="btn btn-secondary !min-h-[32px] !px-2.5 !py-1 !text-[12px]"
                                title="Edit settings"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() =>
                                  window.open(`/api/hackathons/${h.id}/export`, '_blank')
                                }
                                className="btn btn-ghost !min-h-[32px] !px-2.5 !py-1 !text-[12px]"
                              >
                                <Download className="h-3.5 w-3.5" aria-hidden />
                                CSV
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="grid gap-3 md:hidden" role="list">
                {hackathons.map((h) => {
                  const st = statusPresentation(h.status);
                  return (
                    <li
                      key={h.id}
                      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 font-display text-[15px] font-bold text-[var(--text-primary)]">
                          {h.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-[var(--radius-full)] border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <dl className="mb-4 grid grid-cols-2 gap-3 text-[13px]">
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            Teams
                          </dt>
                          <dd className="tabular-nums font-semibold text-[var(--text-primary)]">
                            {h._count?.teams ?? 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            Submissions
                          </dt>
                          <dd className="tabular-nums font-semibold text-[var(--text-primary)]">
                            {h._count?.submissions ?? 0}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                            Schedule
                          </dt>
                          <dd className="font-mono text-[11px] text-[var(--text-secondary)]">
                            {formatShortRange(h.startDate, h.endDate)}
                          </dd>
                        </div>
                      </dl>
                      <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-3 sm:flex-row">
                        <Link
                          href={`/organiser/command-center/${h.id}`}
                          className="btn btn-primary !min-h-[36px] flex-1 !text-[12px]"
                        >
                          Open
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                        <div className="flex gap-2">
                          <Link
                            href={`/organiser/edit/${h.id}`}
                            className="btn btn-secondary !min-h-[36px] flex-1 !text-[12px]"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(`/api/hackathons/${h.id}/export`, '_blank')
                            }
                            className="btn btn-ghost !min-h-[36px] flex-1 !text-[12px]"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden />
                            CSV
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
