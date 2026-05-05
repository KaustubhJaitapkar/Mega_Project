'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Gavel, ListChecks, Scale, Target } from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  judges?: { id: string }[];
}

function JudgeHackathonCard({
  hackathon,
  isMentor,
  progress,
}: {
  hackathon: Hackathon;
  isMentor: boolean;
  progress?: { scored: number; pending: number };
}) {
  const [judgingOpen, setJudgingOpen] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathon.id}/judging-control`);
        const data = await res.json();
        if (mounted) setJudgingOpen(!!data.data?.judgingOpen);
      } catch {
        if (mounted) setJudgingOpen(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [hackathon.id]);

  const isJudgingClosed = judgingOpen === false;
  const href = isMentor ? '/mentor/dashboard' : `/judging/${hackathon.id}`;
  const shouldDisable = isJudgingClosed && !isMentor;

  const ctaLabel = isMentor
    ? 'Open mentoring panel'
    : isJudgingClosed
      ? 'Judging closed'
      : judgingOpen === null
        ? 'Checking access…'
        : 'Start judging';

  const cardShell =
    'rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)] transition-[box-shadow,border-color] duration-200';

  const body = (
    <>
      <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)]">{hackathon.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <span
          className={`org-badge ${hackathon.status === 'ONGOING' ? 'org-badge-success' : 'org-badge-muted'}`}
        >
          {hackathon.status}
        </span>
        <span className="org-badge org-badge-muted">
          {new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
          {new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        {!isMentor && progress && (
          <span className="org-badge org-badge-info">
            {progress.scored} scored · {progress.pending} pending
          </span>
        )}
      </div>
      <div
        className={
          shouldDisable
            ? 'org-btn-secondary mt-4 flex min-h-[40px] w-full cursor-not-allowed items-center justify-center opacity-80'
            : 'org-btn-primary mt-4 flex min-h-[40px] w-full items-center justify-center'
        }
        role="presentation"
      >
        {ctaLabel}
      </div>
    </>
  );

  if (shouldDisable) {
    return (
      <div
        className={`${cardShell} cursor-not-allowed opacity-70`}
        aria-label={`${hackathon.title}: judging is closed`}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`group block no-underline ${cardShell} hover:border-[var(--border-strong)] hover:shadow-primer-md`}
    >
      {body}
    </Link>
  );
}

export default function JudgeDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [progress, setProgress] = useState<Record<string, { scored: number; pending: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const role = (session?.user as { role?: string } | undefined)?.role || 'JUDGE';
  const isMentor = role === 'MENTOR';

  const totalPending = !isMentor
    ? Object.values(progress).reduce((a, p) => a + (p?.pending ?? 0), 0)
    : 0;
  const totalScored = !isMentor
    ? Object.values(progress).reduce((a, p) => a + (p?.scored ?? 0), 0)
    : 0;

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    const abort = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/hackathons', { signal: abort.signal });
        const list: Hackathon[] = (await res.json()).data || [];
        const judgeId = (session?.user as { id?: string } | undefined)?.id;
        const filtered = judgeId
          ? list.filter((h) => h.judges?.some((j) => j.id === judgeId))
          : [];
        if (abort.signal.aborted) return;
        setHackathons(filtered);

        if (!isMentor && filtered.length > 0) {
          const entries = await Promise.all(
            filtered.map(async (h) => {
              const r = await fetch(`/api/judge/teams?hackathonId=${h.id}`, { signal: abort.signal });
              const d = await r.json();
              return [h.id, { scored: d.data?.scored || 0, pending: d.data?.pending || 0 }] as const;
            })
          );
          if (!abort.signal.aborted) setProgress(Object.fromEntries(entries));
        } else if (!abort.signal.aborted) {
          setProgress({});
        }
      } catch {
        if (!abort.signal.aborted) {
          setHackathons([]);
          setProgress({});
        }
      } finally {
        if (!abort.signal.aborted) setIsLoading(false);
      }
    })();

    return () => abort.abort();
  }, [session, isMentor, sessionStatus]);

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center font-sans">
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

  return (
    <div className="font-sans text-[var(--text-primary)]">
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--elevation-sm)]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {isMentor ? (
              <Target className="h-6 w-6 text-[var(--accent)]" aria-hidden />
            ) : (
              <Gavel className="h-6 w-6 text-[var(--accent)]" aria-hidden />
            )}
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
              {isMentor ? 'Mentor' : 'Judge'}
            </p>
          </div>
          <h1 className="text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-tight tracking-tight text-[var(--text-primary)]">
            {isMentor ? 'Mentor dashboard' : 'Judge dashboard'}
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {isMentor
              ? 'Events where you are on staff—open the mentoring panel to support teams.'
              : 'Events where you are assigned to evaluate work. Pick an event to open the judging workspace.'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[6px] border border-[var(--border-default)] border-l-4 border-l-[var(--accent)] bg-[var(--bg-elevated)] p-4 shadow-[var(--elevation-sm)]">
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
              {isMentor ? 'Events on your roster' : 'Assigned events'}
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {hackathons.length}
            </p>
          </div>
          <div className="rounded-[6px] border border-[var(--border-default)] border-l-4 border-l-[var(--warning)] bg-[var(--bg-elevated)] p-4 shadow-[var(--elevation-sm)]">
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
              {isMentor ? 'Focus' : 'Pending reviews'}
            </p>
            <p className="mt-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
              {isMentor
                ? 'Unblock teams and clarify requirements.'
                : totalPending > 0
                  ? `${totalPending} submission${totalPending === 1 ? '' : 's'} still need scores.`
                  : 'Nothing in the queue right now.'}
            </p>
          </div>
          <div className="rounded-[6px] border border-[var(--border-default)] border-l-4 border-l-[var(--success)] bg-[var(--bg-elevated)] p-4 shadow-[var(--elevation-sm)] sm:col-span-2 lg:col-span-1">
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
              {isMentor ? 'Next step' : 'Completed scores'}
            </p>
            <p className="mt-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
              {isMentor
                ? 'Choose an event below to open the mentoring tools.'
                : `${totalScored} score${totalScored === 1 ? '' : 's'} recorded across your events.`}
            </p>
          </div>
        </div>

        {hackathons.length === 0 ? (
          <div className="rounded-[6px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-[var(--elevation-sm)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--accent)]">
              {isMentor ? <ListChecks className="h-6 w-6" aria-hidden /> : <Scale className="h-6 w-6" aria-hidden />}
            </div>
            <p className="mt-4 text-[15px] text-[var(--text-secondary)]">No events assigned to you yet.</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Organizers add judges and mentors per hackathon.</p>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">Your events</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {hackathons.map((h) => (
                <JudgeHackathonCard key={h.id} hackathon={h} isMentor={isMentor} progress={progress[h.id]} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
