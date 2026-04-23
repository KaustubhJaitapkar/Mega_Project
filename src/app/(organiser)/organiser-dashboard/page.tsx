'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3, Users, Zap, TrendingUp, Settings, Trophy,
  Award, Megaphone, ChevronRight
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
  { id: 'actions', label: 'Quick Actions', icon: Zap },
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
        <div className="text-center py-16">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-2">No hackathon selected</p>
          <button
            onClick={() => setActiveTab('hackathon')}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 mx-auto"
          >
            Go to Hackathons <ChevronRight className="w-4 h-4" />
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
    <div className="org-shell">
      <div className="org-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="org-title">Command Center</h1>
          <p className="org-subtitle mt-1">Manage your hackathons with full control</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-1 org-panel p-1.5 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[var(--accent)] text-[var(--text-inverse)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="org-panel">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
