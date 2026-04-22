'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Users, FileText, Zap, TrendingUp, Lock, Settings, Trophy } from 'lucide-react';
import HackathonManagement from '@/components/organiser/HackathonManagement';
import StaffManagement from '@/components/organiser/StaffManagement';
import AnalyticsDashboard from '@/components/organiser/AnalyticsDashboard';
import TeamMonitoring from '@/components/organiser/TeamMonitoring';
import SubmissionMonitoring from '@/components/organiser/SubmissionMonitoring';
import AnnouncementSystem from '@/components/organiser/AnnouncementSystem';
import JudgingControl from '@/components/organiser/JudgingControl';
import CertificateSystem from '@/components/organiser/CertificateSystem';

const TABS = [
  { id: 'hackathon', label: 'Hackathon', icon: Settings },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'teams', label: 'Teams', icon: FileText },
  { id: 'submissions', label: 'Submissions', icon: TrendingUp },
  { id: 'announcements', label: 'Announcements', icon: Zap },
  { id: 'judging', label: 'Judging', icon: Trophy },
  { id: 'certificates', label: 'Certificates', icon: Lock },
];

export default function OrganiserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('hackathon');
  const [loading, setLoading] = useState(true);

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
    switch (activeTab) {
      case 'hackathon':
        return <HackathonManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'teams':
        return <TeamMonitoring />;
      case 'submissions':
        return <SubmissionMonitoring />;
      case 'announcements':
        return <AnnouncementSystem />;
      case 'judging':
        return <JudgingControl />;
      case 'certificates':
        return <CertificateSystem />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Organiser Command Center</h1>
          <p className="text-gray-600 mt-2">Manage your hackathon with complete control</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-700 border-transparent hover:text-gray-900'
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
        <div className="bg-white rounded-lg shadow">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
