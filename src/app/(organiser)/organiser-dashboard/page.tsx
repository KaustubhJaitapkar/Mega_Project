'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  Zap,
  TrendingUp,
  Settings,
  Trophy,
  Award,
  Megaphone,
  ChevronRight,
} from 'lucide-react';
import HackathonManagement from '@/components/organiser/HackathonManagement';
import StaffManagement from '@/components/organiser/StaffManagement';
import AnalyticsDashboard from '@/components/organiser/AnalyticsDashboard';
import TeamMonitoring from '@/components/organiser/TeamMonitoring';
import SubmissionMonitoring from '@/components/organiser/SubmissionMonitoring';
import AnnouncementSystem from '@/components/organiser/AnnouncementSystem';
import JudgingControl from '@/components/organiser/JudgingControl';
import CertificateSystem from '@/components/organiser/CertificateSystem';
import QuickActions from '@/components/organiser/QuickActions';

const TABS = [
  { id: 'hackathon', label: 'Hackathons', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'submissions', label: 'Submissions', icon: TrendingUp },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'judging', label: 'Judging', icon: Trophy },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'actions', label: 'Quick actions', icon: Zap },
];

export default function OrganiserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('hackathon');
  const [loading, setLoading] = useState(true);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
    } else if ((session.user as any)?.role !== 'ORGANISER') {
      router.push('/dashboard');
    } else {
      setLoading(false);
    }
  }, [session, router]);

  if (loading || !session) return null;

  const renderContent = () => {
    if (activeTab === 'hackathon') {
      return (
        <HackathonManagement
          onSelect={(id) => setSelectedHackathonId(id)}
          selectedId={selectedHackathonId}
        />
      );
    }

    if (!selectedHackathonId) {
      return (
        <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-14 text-center shadow-[var(--elevation-sm)]">
          <Settings
            className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]"
            aria-hidden
          />
          <p className="mb-1 font-medium text-[var(--text-primary)]">
            No hackathon selected
          </p>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Choose an event under Hackathons first, then open Analytics, Teams, or other tabs.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('hackathon')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0969da] hover:text-[#0550ae]"
          >
            Go to Hackathons
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'staff':
        return <StaffManagement hackathonId={selectedHackathonId} />;
      case 'analytics':
        return <AnalyticsDashboard hackathonId={selectedHackathonId} />;
      case 'teams':
        return <TeamMonitoring hackathonId={selectedHackathonId} />;
      case 'submissions':
        return <SubmissionMonitoring hackathonId={selectedHackathonId} />;
      case 'announcements':
        return <AnnouncementSystem hackathonId={selectedHackathonId} />;
      case 'judging':
        return <JudgingControl hackathonId={selectedHackathonId} />;
      case 'certificates':
        return <CertificateSystem hackathonId={selectedHackathonId} />;
      case 'actions':
        return <QuickActions hackathonId={selectedHackathonId} />;
      default:
        return null;
    }
  };

  return (
    <div className="org-shell min-h-full">
      <div className="org-page mx-auto max-w-[1200px]">
        <header className="mb-8 border-b border-[var(--border-default)] pb-8">
          <p className="font-mono text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
            Organiser workspace
          </p>
          <h1 className="org-title mt-2 text-[clamp(1.5rem,2.5vw,1.85rem)] font-semibold tracking-tight">
            Command center
          </h1>
          <p className="org-subtitle mt-2 max-w-2xl text-[15px]">
            Pick a hackathon, then switch tabs to manage operations for that event. Prefer a
            single-event view? Use{' '}
            <span className="font-medium text-[var(--text-primary)]">Dashboard</span> in the
            sidebar and open an event from there.
          </p>
        </header>

        <div className="mb-6 overflow-x-auto pb-1">
          <div
            className="flex min-w-max gap-1 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-[var(--elevation-sm)]"
            role="tablist"
            aria-label="Command center sections"
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

        <div className="org-panel rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] p-6 shadow-[var(--elevation-sm)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
