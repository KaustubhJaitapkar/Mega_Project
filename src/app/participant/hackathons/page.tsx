'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarRange,
  ChevronRight,
  LayoutGrid,
  Radio,
  Search,
  Users,
} from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  status?: string;
  _count: { teams: number; submissions: number };
}

type StatusFilter = 'ALL' | 'REGISTRATION' | 'ONGOING' | 'ENDED';

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

function statusBadge(status?: string): { label: string; className: string } {
  const s = (status || '').toUpperCase();
  if (s === 'ONGOING') return { label: 'Live', className: 'org-badge org-badge-success' };
  if (s === 'REGISTRATION') return { label: 'Open', className: 'org-badge org-badge-accent' };
  if (s === 'ENDED') return { label: 'Ended', className: 'org-badge org-badge-muted' };
  if (s === 'CANCELLED') return { label: 'Off', className: 'org-badge org-badge-danger' };
  return { label: s || '—', className: 'org-badge org-badge-info' };
}

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'REGISTRATION', label: 'Registration' },
  { id: 'ONGOING', label: 'Live' },
  { id: 'ENDED', label: 'Ended' },
];

export default function ExploreHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hackathons?limit=100');
        setHackathons((await res.json()).data || []);
      } catch {
        /* silent */
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return hackathons.filter((h) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const descriptionText = stripRichText(h.shortDescription || h.description);
      return (
        h.title.toLowerCase().includes(term) ||
        descriptionText.toLowerCase().includes(term) ||
        (h.location || '').toLowerCase().includes(term)
      );
    });
  }, [hackathons, search]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'ALL') return filtered;
    return filtered.filter((h) => (h.status || '').toUpperCase() === statusFilter);
  }, [filtered, statusFilter]);

  return (
    <div className="font-sans text-[var(--text-primary)]">
      {/* Catalog chrome — split from card grid: band + sidebar list pattern */}
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <Link
              href="/participant/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-[var(--accent)]" aria-hidden />
              <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Explore</p>
            </div>
            <h1 className="mt-2 text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight">
              Hackathon catalog
            </h1>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Filter by phase, search by name or venue, then open an event for full details.
            </p>
          </div>
          <div className="relative w-full lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden
            />
            <input
              className="org-input h-11 w-full rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, description, location…"
              aria-label="Search hackathons"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 lg:grid-cols-[200px_1fr] lg:gap-10 lg:px-6 lg:py-10">
        {/* Filter rail — vertical (different from typical top chips-only) */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Phase</p>
          <nav className="mt-3 flex flex-row gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {FILTERS.map((f) => {
              const active = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`whitespace-nowrap rounded-[6px] border px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </nav>
          <p className="mt-6 font-mono text-[12px] text-[var(--text-muted)]">
            Showing{' '}
            <span className="font-semibold text-[var(--text-primary)]">{filteredByStatus.length}</span> of{' '}
            {hackathons.length}
          </p>
        </aside>

        <section aria-labelledby="catalog-heading">
          <h2 id="catalog-heading" className="sr-only">
            Hackathon list
          </h2>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
                role="status"
                aria-label="Loading"
              />
            </div>
          ) : filteredByStatus.length === 0 ? (
            <div className="rounded-[6px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-16 text-center shadow-[var(--elevation-sm)]">
              <p className="text-[15px] text-[var(--text-secondary)]">No hackathons match your filters.</p>
              <button
                type="button"
                className="mt-4 font-mono text-[12px] font-semibold text-[var(--accent)] hover:underline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredByStatus.map((h) => {
                const summary = stripRichText(h.shortDescription || h.description);
                const tone = statusBadge(h.status);
                const start = new Date(h.startDate);
                const end = new Date(h.endDate);
                const initial = h.title.trim().charAt(0).toUpperCase() || '?';
                return (
                  <li key={h.id}>
                    <Link
                      href={`/participant/hackathons/${h.id}`}
                      className="group flex flex-col gap-4 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 shadow-[var(--elevation-sm)] transition-colors hover:border-[var(--accent)] sm:flex-row sm:items-center sm:gap-5 sm:p-5"
                    >
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <div
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-raised)]"
                          aria-hidden
                        >
                          {h.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={h.logoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--accent)]">
                              {initial}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={tone.className}>{tone.label}</span>
                            <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[var(--text-muted)]">
                              {h.isVirtual ? (
                                <>
                                  <Radio className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
                                  Virtual
                                </>
                              ) : (
                                <>
                                  <CalendarRange className="h-3.5 w-3.5 text-[var(--text-secondary)]" aria-hidden />
                                  {h.location || 'Venue TBA'}
                                </>
                              )}
                            </span>
                          </div>
                          <h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent)]">
                            {h.title}
                          </h3>
                          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                            {summary || 'Open for details.'}
                          </p>
                          <p className="mt-2 font-mono text-[12px] text-[var(--text-muted)]">
                            {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {' — '}
                            {end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-row items-center justify-between gap-4 border-t border-[var(--border-default)] pt-4 sm:flex-col sm:border-t-0 sm:pt-0 md:flex-row">
                        <div className="flex items-center gap-1.5 font-mono text-[12px] text-[var(--text-muted)]">
                          <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                          <span>
                            <strong className="font-semibold text-[var(--text-primary)]">{h._count?.teams ?? 0}</strong>{' '}
                            teams
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]">
                          View
                          <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
