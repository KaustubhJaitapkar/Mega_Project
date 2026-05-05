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
      className: 'bg-[#f6f8fa] text-[#57606a] border-[#d0d7de]',
    },
    PUBLISHED: {
      label: 'Published',
      className: 'bg-[#ddf4ff] text-[#0969da] border-[rgba(9,105,218,0.2)]',
    },
    REGISTRATION: {
      label: 'Registration',
      className: 'bg-[#ddf4ff] text-[#0550ae] border-[rgba(5,80,174,0.2)]',
    },
    ONGOING: {
      label: 'Ongoing',
      className: 'bg-[#dafbe1] text-[#1a7f37] border-[rgba(26,127,55,0.2)]',
    },
    JUDGING: {
      label: 'Judging',
      className: 'bg-[#fff8c5] text-[#9a6700] border-[rgba(154,103,0,0.2)]',
    },
    ENDED: {
      label: 'Ended',
      className: 'bg-[#f6f8fa] text-[#57606a] border-[#d0d7de]',
    },
    CANCELLED: {
      label: 'Cancelled',
      className: 'bg-[#ffebe9] text-[#cf222e] border-[rgba(207,34,46,0.2)]',
    },
  };
  return map[s] || {
    label: s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
    className: 'bg-[#f6f8fa] text-[#57606a] border-[#d0d7de]',
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
        const res = await fetch('/api/hackathons');
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
    <div className="org-shell min-h-full">
      <div className="org-page mx-auto max-w-[1200px]">
        {/* Page header */}
        <header className="mb-6 flex flex-col gap-5 border-b border-[var(--border-default)] pb-6 sm:mb-8 sm:gap-6 sm:pb-8 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
              Organiser workspace
            </p>
            <h1 className="org-title text-[clamp(1.5rem,2.5vw,1.85rem)] font-semibold tracking-tight text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="org-subtitle max-w-xl text-[15px] leading-relaxed">
              Review every hackathon, jump into operations for a single event, and export data when you need it offline.
            </p>
          </div>
          <div className="flex w-full flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap md:w-auto md:justify-end">
            <Link
              href="/organiser/scan"
              className="org-btn-secondary inline-flex h-9 min-h-[44px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#d0d7de] bg-[#f6f8fa] px-3 text-sm font-medium text-[#24292f] shadow-[var(--elevation-sm)] transition-colors hover:bg-[#eef2f6] sm:h-8 sm:min-h-0 sm:w-auto"
            >
              <QrCode className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              QR Scanner
            </Link>
            <Link
              href="/create"
              className="inline-flex h-9 min-h-[44px] w-full items-center justify-center gap-2 rounded-[6px] border border-[#0969da] bg-[#0969da] px-3 text-sm font-semibold text-white shadow-[var(--elevation-sm)] transition-colors hover:bg-[#0860ca] sm:h-8 sm:min-h-0 sm:w-auto"
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
              className="flex gap-4 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] p-4 shadow-[var(--elevation-sm)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                  {label}
                </p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
                  {isLoading ? '—' : value}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>
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
                className="text-lg font-semibold tracking-tight text-[var(--text-primary)]"
              >
                Your hackathons
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Select an event to open the command center for day‑to‑day operations.
              </p>
            </div>
            {!isLoading && hackathons.length > 0 && (
              <p className="font-mono text-[12px] text-[var(--text-muted)]">
                {hackathons.length} event{hackathons.length === 1 ? '' : 's'}
              </p>
            )}
          </div>

          {isLoading ? (
            <div
              className="flex justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] py-16 shadow-[var(--elevation-sm)]"
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
            <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-[var(--elevation-sm)]">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] text-[var(--text-muted)]">
                <LayoutDashboard className="h-6 w-6" aria-hidden />
              </div>
              <p className="mb-1 text-base font-medium text-[var(--text-primary)]">
                No hackathons yet
              </p>
              <p className="mb-6 text-sm text-[var(--text-secondary)]">
                Create an event to enable registration, teams, submissions, and judging.
              </p>
              <Link
                href="/create"
                className="inline-flex h-8 items-center justify-center gap-2 rounded-[6px] bg-[#1f883d] px-4 text-sm font-semibold text-white shadow-[var(--elevation-sm)] transition-colors hover:bg-[#1a7f37]"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Create your first hackathon
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop / tablet: horizontal scroll if needed */}
              <div className="hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] shadow-[var(--elevation-sm)] md:block md:overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm lg:min-w-0">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        Event
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 font-semibold text-[var(--text-primary)] tabular-nums"
                      >
                        Teams
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 font-semibold text-[var(--text-primary)] tabular-nums"
                      >
                        Submissions
                      </th>
                      <th scope="col" className="px-4 py-3 font-semibold text-[var(--text-primary)]">
                        Schedule
                      </th>
                      <th scope="col" className="px-4 py-3 text-right font-semibold text-[var(--text-primary)]">
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
                          className="border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--bg-surface)]"
                        >
                          <td className="max-w-[280px] px-4 py-3 align-middle">
                            <span className="font-medium text-[var(--text-primary)]">{h.title}</span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span
                              className={`inline-flex rounded-[6px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${st.className}`}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle tabular-nums text-[var(--text-primary)]">
                            {h._count?.teams ?? 0}
                          </td>
                          <td className="px-4 py-3 align-middle tabular-nums text-[var(--text-primary)]">
                            {h._count?.submissions ?? 0}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-secondary)]">
                              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                              {formatShortRange(h.startDate, h.endDate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <Link
                                href={`/organiser/command-center/${h.id}`}
                                className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#0969da] px-3 text-xs font-semibold text-white shadow-[var(--elevation-sm)] hover:bg-[#0860ca]"
                              >
                                Command center
                                <ExternalLink className="h-3.5 w-3.5 opacity-90" aria-hidden />
                              </Link>
                              <Link
                                href={`/organiser/edit/${h.id}`}
                                className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[var(--border-default)] bg-[#f6f8fa] px-2.5 text-xs font-medium text-[#24292f] hover:bg-[#eef2f6]"
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
                                className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
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
                      className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] p-4 shadow-[var(--elevation-sm)]"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 font-semibold text-[var(--text-primary)]">
                          {h.title}
                        </h3>
                        <span
                          className={`shrink-0 rounded-[6px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${st.className}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                            Teams
                          </dt>
                          <dd className="tabular-nums font-medium text-[var(--text-primary)]">
                            {h._count?.teams ?? 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                            Submissions
                          </dt>
                          <dd className="tabular-nums font-medium text-[var(--text-primary)]">
                            {h._count?.submissions ?? 0}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                            Schedule
                          </dt>
                          <dd className="font-mono text-[12px] text-[var(--text-secondary)]">
                            {formatShortRange(h.startDate, h.endDate)}
                          </dd>
                        </div>
                      </dl>
                      <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-3 sm:flex-row">
                        <Link
                          href={`/organiser/command-center/${h.id}`}
                          className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-[6px] bg-[#0969da] text-xs font-semibold text-white shadow-[var(--elevation-sm)] hover:bg-[#0860ca]"
                        >
                          Command center
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                        <div className="flex gap-2">
                          <Link
                            href={`/organiser/edit/${h.id}`}
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[6px] border border-[var(--border-default)] bg-[#f6f8fa] text-xs font-medium text-[#24292f] hover:bg-[#eef2f6]"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              window.open(`/api/hackathons/${h.id}/export`, '_blank')
                            }
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
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
