'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Upload,
  Megaphone,
  LifeBuoy,
  Scale,
  BarChart3,
  LineChart,
  Award,
  Briefcase,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import AnnouncementSystem from '@/components/organiser/AnnouncementSystem';
import AnalyticsDashboard from '@/components/organiser/AnalyticsDashboard';
import CertificateSystem from '@/components/organiser/CertificateSystem';
import JudgingControl from '@/components/organiser/JudgingControl';
import StaffManagement from '@/components/organiser/StaffManagement';
import SubmissionMonitoring from '@/components/organiser/SubmissionMonitoring';
import TeamMonitoring from '@/components/organiser/TeamMonitoring';
import HelpTickets from '@/components/HelpTickets';

interface Stats {
  totalTeams: number;
  participantsCount: number;
  submittedCount: number;
  openTickets: number;
}

const TABS = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'teams', label: 'Teams', Icon: Users },
  { id: 'submissions', label: 'Submissions', Icon: Upload },
  { id: 'announcements', label: 'Announcements', Icon: Megaphone },
  { id: 'tickets', label: 'Support', Icon: LifeBuoy },
  { id: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { id: 'judging', label: 'Judging', Icon: Scale },
  { id: 'results', label: 'Results', Icon: LineChart },
  { id: 'certificates', label: 'Certificates', Icon: Award },
  { id: 'staff', label: 'Staff', Icon: Briefcase },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isTabId(v: string | null): v is TabId {
  return !!v && TABS.some((t) => t.id === v);
}

function statusLabel(status: string) {
  const m: Record<string, string> = {
    DRAFT: 'Draft',
    REGISTRATION: 'Registration open',
    ONGOING: 'Ongoing',
    ENDED: 'Ended',
    CANCELLED: 'Cancelled',
  };
  return m[status] || status;
}

function statusBadgeClass(status: string) {
  const s = (status || 'DRAFT').toUpperCase();
  const map: Record<string, string> = {
    DRAFT: 'bg-[#f6f8fa] text-[#57606a] border-[#d0d7de]',
    REGISTRATION: 'bg-[#ddf4ff] text-[#0550ae] border-[rgba(5,80,174,0.2)]',
    ONGOING: 'bg-[#dafbe1] text-[#1a7f37] border-[rgba(26,127,55,0.2)]',
    ENDED: 'bg-[#f6f8fa] text-[#57606a] border-[#d0d7de]',
    CANCELLED: 'bg-[#ffebe9] text-[#cf222e] border-[rgba(207,34,46,0.2)]',
  };
  return map[s] || 'bg-[#f6f8fa] text-[#57606a] border-[#d0d7de]';
}

function statusGuidance(status: string) {
  const s = (status || 'DRAFT').toUpperCase();
  const copy: Record<string, string> = {
    DRAFT: 'Finish event details, then open registration when you are ready.',
    REGISTRATION: 'Teams can register. Watch teams, submissions, and support tickets.',
    ONGOING: 'Hacking is in progress. Monitor submissions, judging, and support.',
    ENDED: 'Event ended. Publish results and issue certificates as needed.',
    CANCELLED: 'This event was cancelled.',
  };
  return copy[s] || copy.DRAFT;
}

function CommandCenterPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hackathonId = params.hackathonId as string;
  const [stats, setStats] = useState<Stats | null>(null);
  const [hackathon, setHackathon] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const selectTab = useCallback(
    (id: TabId) => {
      setActiveTab(id);
      const p = new URLSearchParams(searchParams.toString());
      if (id === 'overview') {
        p.delete('tab');
      } else {
        p.set('tab', id);
      }
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [statsRes, hackRes, subRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/stats`),
          fetch(`/api/hackathons/${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}/submissions`),
        ]);
        setStats((await statsRes.json()).data || null);
        setHackathon((await hackRes.json()).data || null);
        setSubmissions((await subRes.json()).data || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    })();
  }, [hackathonId]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (isTabId(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleSetTab = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (isTabId(id)) selectTab(id);
    };
    window.addEventListener('SET_TAB', handleSetTab);
    return () => window.removeEventListener('SET_TAB', handleSetTab);
  }, [selectTab]);

  const handleStatusChange = async (newStatus: string) => {
    if (!hackathonId || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setHackathon({ ...hackathon, status: newStatus });
      } else {
        const err = await res.json();
        alert(`Failed to update status: ${err.error}`);
      }
    } catch {
      alert('Network error while updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <OverviewPanel
            stats={stats}
            hackathon={hackathon}
            submissions={submissions}
            hackathonId={hackathonId}
            onSelectTab={selectTab}
          />
        );
      case 'teams':
        return <TeamMonitoring hackathonId={hackathonId} />;
      case 'submissions':
        return (
          <SubmissionMonitoring
            hackathonId={hackathonId}
            submissionRequirements={hackathon?.submissionRequirements || []}
          />
        );
      case 'tickets':
        return <HelpTickets hackathonId={hackathonId} />;
      case 'announcements':
        return <AnnouncementSystem hackathonId={hackathonId} />;
      case 'staff':
        return <StaffManagement hackathonId={hackathonId} />;
      case 'analytics':
        return <AnalyticsDashboard hackathonId={hackathonId} />;
      case 'judging':
        return <JudgingControl hackathonId={hackathonId} />;
      case 'certificates':
        return <CertificateSystem hackathonId={hackathonId} />;
      case 'results':
        return <ResultsPanel hackathonId={hackathonId} />;
      default:
        return null;
    }
  };

  const scheduleHint =
    hackathon?.startDate && hackathon?.endDate
      ? `${new Date(hackathon.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })} – ${new Date(hackathon.endDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`
      : null;

  return (
    <div className="org-shell min-h-full">
      <div className="org-page mx-auto max-w-[1200px]">
        <Link
          href="/organiser/dashboard"
          className="mb-4 inline-flex text-sm font-medium text-[#0969da] hover:text-[#0550ae]"
        >
          ← All hackathons
        </Link>
        <header className="mb-6 flex flex-col gap-4 border-b border-[var(--border-default)] pb-6 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:pb-8">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
              Command center
            </p>
            <h1 className="text-[clamp(1.25rem,2.5vw,1.75rem)] font-semibold tracking-tight text-[var(--text-primary)]">
              {hackathon?.title || 'Loading…'}
            </h1>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {scheduleHint && (
                <p className="text-sm text-[var(--text-secondary)]">{scheduleHint}</p>
              )}
              {hackathon?.status && (
                <span
                  className={`w-fit rounded-[6px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(hackathon.status)}`}
                >
                  {statusLabel(hackathon.status)}
                </span>
              )}
            </div>
          </div>

          {hackathon && (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <Link
                href={`/organiser/edit/${hackathonId}`}
                className="inline-flex h-9 min-h-[44px] items-center justify-center gap-2 rounded-[6px] border border-[var(--border-default)] bg-[#f6f8fa] px-3 text-sm font-medium text-[#24292f] shadow-[var(--elevation-sm)] transition-colors hover:bg-[#eef2f6] sm:h-8 sm:min-h-0"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit event
              </Link>
              <div className="relative min-w-0 sm:min-w-[200px]">
                <select
                  value={hackathon.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdatingStatus}
                  className="h-9 w-full appearance-none rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] py-2 pl-3 pr-9 text-sm font-medium text-[var(--text-primary)] shadow-[var(--elevation-sm)] focus:border-[#0969da] focus:outline-none focus:ring-[3px] focus:ring-[rgba(9,105,218,0.3)] disabled:opacity-50"
                  aria-label="Hackathon status"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REGISTRATION">Registration open</option>
                  <option value="ONGOING">Ongoing</option>
                  <option value="ENDED">Ended</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </div>
            </div>
          )}
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <nav
            className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:w-[200px] lg:flex-shrink-0 lg:flex-col lg:overflow-visible lg:border-r lg:border-[var(--border-default)] lg:pr-4"
            role="tablist"
            aria-label="Command center sections"
          >
            {TABS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  id={`cc-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls="cc-workspace-panel"
                  onClick={() => selectTab(id)}
                  className={`flex shrink-0 items-center gap-2 rounded-[6px] px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full lg:py-2 ${
                    active
                      ? 'bg-[#0969da] text-white shadow-[var(--elevation-sm)]'
                      : 'border border-transparent text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {label}
                </button>
              );
            })}
          </nav>

          <main
            id="cc-workspace-panel"
            role="tabpanel"
            aria-labelledby={`cc-tab-${activeTab}`}
            className="min-h-[min(60vh,480px)] min-w-0 flex-1 scroll-mt-4"
          >
            {loading ? (
              <div className="flex justify-center py-16">
                <div
                  className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
                  role="status"
                  aria-label="Loading"
                />
              </div>
            ) : (
              renderTab()
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({
  stats,
  hackathon,
  submissions,
  hackathonId,
  onSelectTab,
}: {
  stats: Stats | null;
  hackathon: any;
  submissions: any[];
  hackathonId: string;
  onSelectTab: (id: TabId) => void;
}) {
  const openTickets = stats?.openTickets ?? 0;
  const st = (hackathon?.status || 'DRAFT').toUpperCase();

  const cards = [
    {
      key: 'teams',
      label: 'Teams',
      value: stats?.totalTeams ?? '—',
      hint: 'Registered teams',
      tab: 'teams' as const,
      emphasis: false,
    },
    {
      key: 'participants',
      label: 'Participants',
      value: stats?.participantsCount ?? '—',
      hint: 'People on teams',
      tab: 'teams' as const,
      emphasis: false,
    },
    {
      key: 'submissions',
      label: 'Submissions',
      value: stats?.submittedCount ?? '—',
      hint: 'Projects submitted',
      tab: 'submissions' as const,
      emphasis: false,
    },
    {
      key: 'tickets',
      label: 'Open tickets',
      value: openTickets,
      hint: 'Support queue',
      tab: 'tickets' as const,
      emphasis: openTickets > 0,
    },
  ];

  const jumps: { id: TabId; label: string }[] = [
    { id: 'teams', label: 'Teams' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'tickets', label: `Support (${openTickets})` },
    { id: 'analytics', label: 'Analytics' },
    { id: 'judging', label: 'Judging' },
    { id: 'results', label: 'Results' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'staff', label: 'Staff' },
  ];

  return (
    <div className="space-y-6">
      <div
        className="rounded-[6px] border border-[var(--border-default)] bg-[#f6f8fa] px-4 py-3 text-sm leading-snug text-[var(--text-secondary)] shadow-[var(--elevation-sm)]"
        role="note"
      >
        <span className="font-medium text-[var(--text-primary)]">Where you are: </span>
        {statusGuidance(st)}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, value, hint, tab, emphasis }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectTab(tab)}
            className={`rounded-[6px] border bg-[var(--bg-root)] p-4 text-left shadow-[var(--elevation-sm)] transition-colors hover:bg-[var(--bg-surface)] ${
              emphasis
                ? 'border border-[var(--border-default)] border-l-[3px] border-l-[#cf222e]'
                : 'border border-[var(--border-default)]'
            }`}
          >
            <p className="font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
              {value}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{hint}</p>
          </button>
        ))}
      </div>

      <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--elevation-sm)]">
        <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Jump to section</p>
        <div className="flex flex-wrap gap-2">
          {jumps.map(({ id, label: lbl }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTab(id)}
              className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[#eef2f6]"
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-default)] pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          {hackathon?.id && (
            <a
              href={`/participant/hackathons/${hackathon.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0969da] hover:text-[#0550ae]"
            >
              View public event page
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={() => window.open(`/api/hackathons/${hackathonId}/export`, '_blank')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0969da] hover:text-[#0550ae]"
          >
            Download event export (CSV)
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--text-secondary)]">
        {submissions.length === 0
          ? 'No submissions yet. Teams will appear here once they submit.'
          : `${submissions.length} submission${submissions.length === 1 ? '' : 's'} recorded for this event.`}
      </p>
    </div>
  );
}

export default function CommandCenterEntry() {
  return (
    <Suspense
      fallback={
        <div className="org-shell flex min-h-[50vh] items-center justify-center px-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]"
            role="status"
            aria-label="Loading command center"
          />
        </div>
      }
    >
      <CommandCenterPage />
    </Suspense>
  );
}

/* ==================== RESULTS PANEL ==================== */
function ResultsPanel({ hackathonId }: { hackathonId: string }) {
  const [winners, setWinners] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [certRes, subRes, hackathonRes, rankingsRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/certificates`, { credentials: 'include' }),
          fetch(`/api/hackathons/${hackathonId}/submissions`, { credentials: 'include' }),
          fetch(`/api/hackathons/${hackathonId}`, { credentials: 'include' }),
          fetch(`/api/hackathons/${hackathonId}/rankings`, { credentials: 'include' }),
        ]);
        setWinners((await certRes.json()).data?.filter((c: any) => c.type === 'WINNER' || c.type === 'RUNNER_UP' || c.type === 'BEST_PROJECT') || []);
        setSubmissions((await subRes.json()).data || []);
        const hackathonData = (await hackathonRes.json()).data;
        setHackathon(hackathonData);
        setRankings((await rankingsRes.json()).data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  async function loadParticipants() {
    if (participants.length > 0) return;
    setLoadingParticipants(true);
    try {
      // Fetch hackathon teams with members
      const [teamsRes, rankingsRes, certsRes] = await Promise.all([
        fetch(`/api/hackathons/${hackathonId}/teams`, { credentials: 'include' }),
        fetch(`/api/hackathons/${hackathonId}/rankings`, { credentials: 'include' }),
        fetch(`/api/hackathons/${hackathonId}/certificates`, { credentials: 'include' }),
      ]);
      
      const teamsData = await teamsRes.json();
      const rankingsData = await rankingsRes.json();
      const certsData = await certsRes.json();
      
      const teams = teamsData.data || [];
      const rankings = rankingsData.data || [];
      const certificates = certsData.data || [];
      
      // Create rankings map
      const rankingMap = new Map<string, { rank: number; totalScore: number; teamName: string }>();
      for (const r of rankings) {
        rankingMap.set(r.teamId, { rank: r.rank, totalScore: r.totalScore, teamName: r.teamName });
      }
      
      // Create certificates map (teamId -> prize type)
      const teamPrizeMap = new Map<string, string>();
      for (const cert of certificates) {
        if (cert.teamId && ['WINNER', 'RUNNER_UP', 'BEST_PROJECT'].includes(cert.type)) {
          teamPrizeMap.set(cert.teamId, cert.type);
        }
      }
      
      // Build participants list with their team's ranking and prize
      const participantsList: any[] = [];
      const prizeDetails = normalizePrizeDetails(hackathon?.prizeDetails);
      
      for (const team of teams) {
        const ranking = rankingMap.get(team.id);
        const prizeType = teamPrizeMap.get(team.id);
        
        let prizeLabel = 'Participant';
        if (prizeType) {
          // Map certificate type to prize label based on prizeDetails order
          if (prizeType === 'WINNER') {
            prizeLabel = prizeDetails[0]?.title || 'Winner';
          } else if (prizeType === 'RUNNER_UP') {
            prizeLabel = prizeDetails[1]?.title || 'Runner-up';
          } else if (prizeType === 'BEST_PROJECT') {
            prizeLabel = prizeDetails[2]?.title || 'Best Project';
          } else {
            prizeLabel = prizeType.replace('_', ' ');
          }
        } else if (ranking && ranking.rank > 0 && ranking.rank <= prizeDetails.length) {
          // If no certificate but rank matches a prize slot
          prizeLabel = prizeDetails[ranking.rank - 1]?.title || 'Participant';
        }
        
        for (const member of team.members || []) {
          participantsList.push({
            id: member.user?.id || member.id || `${team.id}-${member.user?.name}`,
            name: member.user?.name || member.name || 'Unknown',
            email: member.user?.email || member.email || '-',
            teamName: team.name,
            teamId: team.id,
            rank: ranking?.rank || 999,
            score: ranking?.totalScore ?? 0,
            prizeLabel,
          });
        }
      }
      
      // Sort by rank (unranked at the end), then by name
      participantsList.sort((a, b) => {
        if (a.rank !== b.rank) {
          // Unranked (999) goes to the end
          if (a.rank === 999) return 1;
          if (b.rank === 999) return -1;
          return a.rank - b.rank;
        }
        return a.name.localeCompare(b.name);
      });
      
      setParticipants(participantsList);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
    setLoadingParticipants(false);
  }

  function toggleParticipants() {
    if (!showParticipants && participants.length === 0) {
      loadParticipants();
    }
    setShowParticipants(!showParticipants);
  }

  async function generateResults() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/rankings`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setRankings(data.data || []);
        const scored = (data.data || []).filter((r: any) => r.totalScore > 0);
        setFeedback(scored.length > 0 ? `Results generated for ${scored.length} teams` : 'No scored submissions found');
      } else {
        setFeedback(data.error || 'Failed to generate results');
      }
    } catch { setFeedback('Network error'); }
    setGenerating(false);
    setTimeout(() => setFeedback(''), 4000);
  }

  async function announceResults() {
    if (!announceTitle.trim() || !announceContent.trim()) return;
    setSendingAnnounce(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/announcements`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: announceTitle, content: announceContent, isUrgent: false }),
      });
      if (res.ok) { setFeedback('Results announced on website'); setAnnounceTitle(''); setAnnounceContent(''); }
      else setFeedback('Failed to announce');
    } catch { setFeedback('Network error'); }
    setSendingAnnounce(false);
    setTimeout(() => setFeedback(''), 3000);
  }

  async function declareTeamWinner(teamId: string, teamName: string, type: string) {
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teamId, type }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(`${type.replace('_', ' ')} declared for ${teamName}`);
        const certRes = await fetch(`/api/hackathons/${hackathonId}/certificates`);
        setWinners((await certRes.json()).data?.filter((c: any) => ['WINNER', 'RUNNER_UP', 'BEST_PROJECT'].includes(c.type)) || []);
      } else {
        setFeedback(data.error || 'Failed to declare winner');
      }
    } catch { setFeedback('Network error'); }
    setTimeout(() => setFeedback(''), 3000);
  }

  async function autoDeclareWinners() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mode: 'auto' }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Winner and Runner-up auto-declared from rankings');
        const certRes = await fetch(`/api/hackathons/${hackathonId}/certificates`);
        setWinners((await certRes.json()).data?.filter((c: any) => ['WINNER', 'RUNNER_UP', 'BEST_PROJECT'].includes(c.type)) || []);
      } else {
        setFeedback(data.error || 'Failed to auto-declare');
      }
    } catch { setFeedback('Network error'); }
    setGenerating(false);
    setTimeout(() => setFeedback(''), 4000);
  }

  function formatPrizeAmount(amount?: number | string) {
    if (!amount) return null;
    if (typeof amount === 'number') return `$${amount.toLocaleString()}`;
    return amount;
  }

  function normalizePrizeDetails(value?: any) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try { return JSON.parse(value); } catch { return []; }
  }

  function getPrizeLabelForRank(rank: number, prizeDetails: any[]) {
    if (prizeDetails.length > 0 && prizeDetails[rank - 1]?.title) {
      return prizeDetails[rank - 1].title;
    }
    if (rank === 1) return 'Winner';
    if (rank === 2) return 'Runner-up';
    if (rank === 3) return 'Best Project';
    return '-';
  }

  function exportPrizeResultsCSV() {
    if (!rankings.length) return;

    const prizeDetails = normalizePrizeDetails(hackathon?.prizeDetails);
    const scoredTeams = rankings.filter((r: any) => r.totalScore > 0);

    // Create CSV header
    const csvRows = ['Rank,Team Name,Total Score,Judges Scored,Prize Category'];

    for (const team of scoredTeams) {
      const prize = getPrizeLabelForRank(team.rank, prizeDetails);
      csvRows.push([
        team.rank,
        `"${team.teamName}"`,
        team.totalScore.toFixed(2),
        team.judgeCount,
        prize,
      ].join(','));
    }

    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hackathon?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'hackathon'}_prize_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportParticipantsCSV() {
    if (participants.length === 0) {
      setFeedback('No participants to export');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    
    const csvRows = ['Rank,Participant Name,Email,Team Name,Score,Prize Category'];
    
    for (const p of participants) {
      csvRows.push([
        p.rank === 999 ? 'N/A' : p.rank,
        `"${p.name}"`,
        `"${p.email}"`,
        `"${p.teamName}"`,
        p.score?.toFixed(2) || '0',
        p.prizeLabel,
      ].join(','));
    }
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hackathon?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'hackathon'}_participants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function announceWinnersAutomatically() {
    if (rankings.length === 0) {
      setFeedback('No rankings yet. Generate rankings first.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    const prizeDetails = normalizePrizeDetails(hackathon?.prizeDetails);
    const getTypeLabel = (type: string) => {
      if (type === 'WINNER') return prizeDetails[0]?.title || 'Winner';
      if (type === 'RUNNER_UP') return prizeDetails[1]?.title || 'Runner-up';
      if (type === 'BEST_PROJECT') return prizeDetails[2]?.title || 'Best Project';
      return type.replace('_', ' ');
    };

    setSendingAnnounce(true);
    try {
      const title = `${hackathon?.title || 'Hackathon'} Results Announced!`;
      let content: string;

      if (winners.length > 0) {
        const lines = winners.map((cert: any) => {
          const label = getTypeLabel(cert.type);
          const teamName = cert.team?.name || 'Team';
          const memberNames = cert.user?.name || 'Team members';
          return `${label}: ${teamName} (${memberNames})`;
        });
        content = `🎉 Results are in! Congratulations to our winners:\n\n${lines.join('\n')}\n\nThank you to all participants!`;
      } else {
        const scored = [...rankings]
          .filter((r: any) => Number(r.totalScore) > 0)
          .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999));
        if (scored.length === 0) {
          setFeedback('No scored teams yet. Judges need to submit scores before announcing.');
          setSendingAnnounce(false);
          setTimeout(() => setFeedback(''), 4000);
          return;
        }
        const top = scored.slice(0, 8);
        const lines = top.map((r: any) => {
          const prize = getPrizeLabelForRank(r.rank, prizeDetails);
          const pts = Number(r.totalScore).toFixed(1);
          const extra = prize && prize !== '-' ? ` — ${prize}` : '';
          return `#${r.rank} ${r.teamName || 'Team'} — ${pts} pts${extra}`;
        });
        content = `🎉 Results are in! Top teams by judge scores:\n\n${lines.join('\n')}\n\nView full rankings on the hackathon page. Thank you to all participants!`;
      }

      const res = await fetch(`/api/hackathons/${hackathonId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, content, isUrgent: false }),
      });
      if (res.ok) {
        setFeedback('Results announced on website');
      } else {
        setFeedback('Failed to announce');
      }
    } catch {
      setFeedback('Network error');
    }
    setSendingAnnounce(false);
    setTimeout(() => setFeedback(''), 3000);
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
      <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedback && <div className={`org-feedback ${feedback.includes('error') || feedback.includes('Failed') || feedback.includes('No ') ? 'org-feedback-error' : 'org-feedback-success'}`}>{feedback}</div>}

      {/* Generate Results */}
      <div className="org-section">
        <p className="org-label" style={{ marginBottom: '0.6rem' }}>Generate Results</p>
        <p className="org-text" style={{ marginBottom: '0.75rem' }}>Calculate total scores from judge evaluations using rubric max points. Rankings sum scores across all judges.</p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="org-btn-primary" onClick={generateResults} disabled={generating}>
            {generating ? 'Calculating...' : 'Generate Rankings'}
          </button>
          <button className="org-btn-secondary" onClick={announceWinnersAutomatically} disabled={sendingAnnounce || rankings.length === 0}>
            {sendingAnnounce ? 'Announcing...' : 'Announce Results'}
          </button>
        </div>
      </div>

      {/* Prize Results View */}
      <>
        {/* Prize Details from Hackathon */}
        {hackathon && (
          <div className="org-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <p className="org-label" style={{ margin: 0 }}>Prize Details</p>
              {rankings.length > 0 && (
                <button className="org-btn-secondary" onClick={exportPrizeResultsCSV} style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}>
                  Download CSV
                </button>
              )}
            </div>
            {hackathon.prize && (
              <div style={{ padding: '0.75rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Prize Pool</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{hackathon.prize}</span>
              </div>
            )}
            {(() => {
              const prizeDetails = normalizePrizeDetails(hackathon.prizeDetails);
              if (prizeDetails.length === 0) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {prizeDetails.map((prize: any, idx: number) => (
                    <div key={prize.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{prize.title}</span>
                      {formatPrizeAmount(prize.amount) && (
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>{formatPrizeAmount(prize.amount)}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Rankings Table */}
        {rankings.length > 0 && (
          <div>
            <p className="org-label" style={{ marginBottom: '0.6rem' }}>Team Rankings ({rankings.filter((r: any) => r.totalScore > 0).length} scored)</p>
            {rankings.filter((r: any) => r.totalScore > 0).map((entry: any, idx: number) => {
              const winnerInfo = winners.find((w: any) => w.teamId === entry.teamId);
              return (
                <div key={entry.teamId} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 0.85rem', background: 'var(--bg-raised)',
                  borderRadius: 'var(--radius-sm)', marginBottom: '0.35rem',
                  border: idx === 0 ? '1px solid #0969da' : winnerInfo ? '1px solid rgba(26,127,55,0.35)' : '1px solid var(--border-default)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                      fontWeight: 700, fontSize: idx < 3 ? '1.1rem' : '0.9rem',
                      color: idx === 0 ? '#0969da' : idx === 1 ? '#57606a' : idx === 2 ? '#9a6700' : 'var(--text-muted)',
                      minWidth: 24, textAlign: 'center',
                    }}>
                      #{entry.rank}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{entry.teamName}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{entry.judgeCount} judge{entry.judgeCount !== 1 ? 's' : ''} scored</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {(() => {
                      const prizeDetails = normalizePrizeDetails(hackathon?.prizeDetails);
                      const prizeLabel = getPrizeLabelForRank(entry.rank, prizeDetails);
                      return prizeLabel !== '-' ? (
                        <span className="org-badge org-badge-accent">
                          {prizeLabel}
                        </span>
                      ) : null;
                    })()}
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
                      {entry.totalScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
            {rankings.filter((r: any) => r.totalScore === 0).length > 0 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {rankings.filter((r: any) => r.totalScore === 0).length} team(s) not yet scored
              </p>
            )}
          </div>
        )}
      </>

    </div>
  );
}
