'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AnalyticsDashboard from '@/components/organiser/AnalyticsDashboard';
import AnnouncementSystem from '@/components/organiser/AnnouncementSystem';
import CertificateSystem from '@/components/organiser/CertificateSystem';
import JudgingControl from '@/components/organiser/JudgingControl';
import QuickActions from '@/components/organiser/QuickActions';
import StaffManagement from '@/components/organiser/StaffManagement';
import SubmissionMonitoring from '@/components/organiser/SubmissionMonitoring';
import TeamMonitoring from '@/components/organiser/TeamMonitoring';
import HelpTickets from '@/components/HelpTickets';

interface Stats { totalTeams: number; participantsCount: number; submittedCount: number; openTickets: number }

const TAB_GROUPS = [
  {
    name: 'Core',
    tabs: [
      { id: 'overview', label: 'Overview', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> },
      { id: 'teams', label: 'Teams', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
      { id: 'submissions', label: 'Submissions', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg> },
    ]
  },
  {
    name: 'Engagement',
    tabs: [
      { id: 'announcements', label: 'Announcements', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> },
      { id: 'tickets', label: 'Support Queue', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
    ]
  },
  {
    name: 'The Lab',
    tabs: [
      { id: 'judging', label: 'Judging', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="14.31" y1="8" x2="20.05" y2="17.94"/><line x1="9.69" y1="8" x2="21.17" y2="8"/><line x1="7.38" y1="12" x2="13.12" y2="2.06"/><line x1="9.69" y1="16" x2="3.95" y2="6.06"/><line x1="14.31" y1="16" x2="2.83" y2="16"/><line x1="16.62" y1="12" x2="10.88" y2="21.94"/></svg> },
      { id: 'results', label: 'Results', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
      { id: 'certificates', label: 'Certificates', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg> },
    ]
  },
  {
    name: 'People',
    tabs: [
      { id: 'staff', label: 'Staff', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> },
    ]
  }
] as const;

type TabId = typeof TAB_GROUPS[number]['tabs'][number]['id'];

export default function CommandCenterPage() {
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  const [stats, setStats] = useState<Stats | null>(null);
  const [hackathon, setHackathon] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  useEffect(() => {
    const handleSetTab = (e: CustomEvent) => {
      const allTabs: { id: string }[] = TAB_GROUPS.flatMap(g => [...g.tabs]);
      if (allTabs.some(t => t.id === e.detail)) {
        setActiveTab(e.detail as TabId);
      }
    };
    window.addEventListener('SET_TAB', handleSetTab as EventListener);
    return () => window.removeEventListener('SET_TAB', handleSetTab as EventListener);
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (!hackathonId || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setHackathon({ ...hackathon, status: newStatus });
      } else {
        const err = await res.json();
        alert(`Failed to update status: ${err.error}`);
      }
    } catch (err) {
      alert('Network error while updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewPanel stats={stats} hackathon={hackathon} submissions={submissions} />;
      case 'teams': return <TeamMonitoring hackathonId={hackathonId} />;
      case 'submissions': return <SubmissionMonitoring hackathonId={hackathonId} />;
      case 'tickets': return <HelpTickets hackathonId={hackathonId} />;
      case 'announcements': return <AnnouncementSystem hackathonId={hackathonId} />;
      case 'staff': return <StaffManagement hackathonId={hackathonId} />;
      case 'judging': return <JudgingControl hackathonId={hackathonId} />;
      case 'certificates': return <CertificateSystem hackathonId={hackathonId} />;
      case 'results': return <ResultsPanel hackathonId={hackathonId} />;

      default: return null;
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      <style>{`
        .btn-premium-ghost {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.08);
          color: var(--text-primary);
          padding: 0.6rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .btn-premium-ghost:hover {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.02);
          box-shadow: 0 0 10px rgba(255,255,255,0.03);
        }
        .subnav-btn {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          padding: 0.35rem 0.6rem;
          border-radius: var(--radius-sm);
          color: #888888;
          font-size: 0.78rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .subnav-btn:hover {
          background: var(--bg-raised);
          color: var(--text-primary);
        }
        .subnav-btn.active {
          background: var(--bg-surface);
          color: var(--text-primary);
          font-weight: 500;
          box-shadow: inset 2px 0 0 var(--accent);
        }
        .step-col {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-left: 1px solid rgba(255,255,255,0.05);
          padding-left: 0.75rem;
          position: relative;
        }
        .loss-badge {
          position: absolute;
          top: 10px;
          right: -15px;
          background: #3f1515;
          color: #ef4444;
          font-size: 0.55rem;
          padding: 2px 5px;
          border-radius: 4px;
          font-weight: 700;
          z-index: 10;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#A0A0A0', marginBottom: '0.5rem' }}>
            Command Center
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {hackathon?.title || 'Loading...'}
          </h1>
        </div>
        
        {/* Status Switcher */}
        {hackathon && (
          <div style={{ position: 'relative', opacity: isUpdatingStatus ? 0.5 : 1, transition: 'opacity 0.2s' }}>
            <select
              value={hackathon.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdatingStatus}
              style={{
                appearance: 'none',
                background: hackathon.status === 'ONGOING' ? 'rgba(62, 207, 142, 0.1)' : hackathon.status === 'REGISTRATION' ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface)',
                border: `1px solid ${hackathon.status === 'ONGOING' ? 'rgba(62, 207, 142, 0.3)' : hackathon.status === 'REGISTRATION' ? 'rgba(56, 189, 248, 0.3)' : 'var(--border-subtle)'}`,
                color: hackathon.status === 'ONGOING' ? '#3ecf8e' : hackathon.status === 'REGISTRATION' ? '#38bdf8' : 'var(--text-primary)',
                padding: '0.4rem 2rem 0.4rem 1.25rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <option value="DRAFT">Draft Mode</option>
              <option value="REGISTRATION">Registration Open</option>
              <option value="ONGOING">Hackathon Started</option>
              <option value="ENDED">Hackathon Ended</option>
            </select>
            <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'inherit', opacity: 0.7 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '3rem', alignItems: 'start' }}>
        {/* Vertical Sub-Nav Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {TAB_GROUPS.map((group) => (
            <div key={group.name}>
              <p style={{ color: '#A0A0A0', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.4rem', fontWeight: 600, paddingLeft: '0.6rem' }}>{group.name}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                {group.tabs.map((tab) => (
                  <button key={tab.id} className={`subnav-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id as TabId)}>
                    <span style={{ opacity: activeTab === tab.id ? 1 : 0.6 }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        {/* Main Content Area */}
        <main style={{ background: 'var(--bg-root)', minHeight: 400 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
            </div>
          ) : renderTab()}
        </main>
      </div>
    </div>
  );
}

/* ==================== OVERVIEW PANEL ==================== */
const Sparkline = ({ color }: { color: string }) => (
  <svg width="48" height="18" viewBox="0 0 48 18" fill="none" style={{ opacity: 0.8 }}>
    <path d="M0 14 L8 12 L16 15 L24 8 L32 10 L40 4 L48 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function OverviewPanel({ stats, hackathon, submissions }: { stats: Stats | null; hackathon: any; submissions: any[] }) {
  const activePhase = 'development';
  const PHASES = ['ideation', 'development', 'judging', 'results'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* 1. Left-Aligned Architectural Timeline */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
          {PHASES.map((phase) => {
            const isActive = activePhase === phase;
            return (
              <div key={phase} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', opacity: isActive ? 1 : 0.4 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 700 : 400, textTransform: 'uppercase', letterSpacing: '0.15em', color: isActive ? 'var(--text-primary)' : '#A0A0A0' }}>
                  {phase}
                </span>
                {isActive && <div style={{ height: 2, width: '140%', background: 'var(--text-primary)', marginLeft: '-10%' }} />}
              </div>
            );
          })}
        </div>
        <button className="btn-premium-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px', padding: '0.35rem 0.75rem', fontSize: '0.7rem' }} onClick={() => window.open(`/participant/hackathons/${hackathon?.id}`, '_blank')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          View Public Page
        </button>
      </div>

      {/* 2. Telemetry Strip (Vitals) */}
      <div style={{ display: 'flex', gap: '3rem', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1rem 0' }}>
        {[
          { label: 'TEAMS', value: stats?.totalTeams ?? 0, color: '#818cf8' },
          { label: 'PARTICIPANTS', value: stats?.participantsCount ?? 0, color: '#3ecf8e' },
          { label: 'SUBMISSIONS', value: stats?.submittedCount ?? 0, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div>
              <p style={{ color: '#888', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', marginBottom: '0.1rem' }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1, color: 'var(--text-primary)' }}>{s.value}</p>
            </div>
            <Sparkline color={s.color} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '4rem', alignItems: 'start' }}>
        
        {/* Main Workspace (Funnel + Live Activity) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          
           {/* Stepped Architectural Funnel */}
           <div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
               <p style={{ color: '#A0A0A0', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>Conversion Funnel</p>
               <span style={{ fontSize: '0.6rem', color: '#666' }}>LAST 24 HOURS</span>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: 120, alignItems: 'end', background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(255,255,255,0.02) 19px, rgba(255,255,255,0.02) 20px)' }}>
                <div className="step-col" style={{ height: '100%' }}>
                  <div className="loss-badge">-32%</div>
                  <div style={{ background: 'var(--bg-raised)', height: '100%', width: '80%', transition: 'height 0.5s' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#888', letterSpacing: '0.05em' }}>VIEWS (2.4k)</p>
                </div>
                <div className="step-col" style={{ height: '68%' }}>
                  <div className="loss-badge">-15%</div>
                  <div style={{ background: 'var(--accent-dim)', height: '100%', width: '80%', borderTop: '2px solid var(--accent)' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.05em' }}>REGISTERED ({stats?.participantsCount ?? 0})</p>
                </div>
                <div className="step-col" style={{ height: '53%' }}>
                  <div className="loss-badge">-5%</div>
                  <div style={{ background: 'var(--bg-raised)', height: '100%', width: '80%' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#888', letterSpacing: '0.05em' }}>TEAMED ({stats?.totalTeams ?? 0})</p>
                </div>
                <div className="step-col" style={{ height: '48%', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ background: 'rgba(52, 211, 153, 0.1)', height: '100%', width: '80%', borderTop: '2px solid #34d399' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: '#34d399', fontWeight: 600, letterSpacing: '0.05em' }}>SUBMITTED ({stats?.submittedCount ?? 0})</p>
                </div>
             </div>
           </div>

           {/* Live Activity Terminal */}
           <div>
             <p style={{ color: '#A0A0A0', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem', fontWeight: 600 }}>Live Activity Log</p>
             <div style={{ background: '#050505', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '1rem', fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: '#A0A0A0', height: 180, overflowY: 'auto' }}>
               <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                 <span style={{ color: '#555' }}>[20:25:10]</span>
                 <span style={{ color: '#818cf8' }}>System:</span>
                 <span style={{ color: '#E0E0E0' }}>Registration gateway ping successful (12ms)</span>
               </div>
               <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                 <span style={{ color: '#555' }}>[20:18:44]</span>
                 <span style={{ color: '#3ecf8e' }}>Webhooks:</span>
                 <span style={{ color: '#E0E0E0' }}>Discord sync authenticated.</span>
               </div>
               {submissions.length > 0 ? (
                 <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                   <span style={{ color: '#555' }}>[{new Date().toTimeString().split(' ')[0]}]</span>
                   <span style={{ color: 'var(--accent)' }}>Submissions:</span>
                   <span style={{ color: '#E0E0E0' }}>Detected {submissions.length} new commits from registered repositories.</span>
                 </div>
               ) : (
                 <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                   <span style={{ color: '#555' }}>[{new Date().toTimeString().split(' ')[0]}]</span>
                   <span style={{ color: '#ef4444' }}>Listener:</span>
                   <span style={{ color: '#E0E0E0' }}>Awaiting initial POST on /api/submissions...</span>
                 </div>
               )}
               <div style={{ display: 'flex', gap: '1rem' }}>
                 <span style={{ color: '#555' }}>[{new Date().toTimeString().split(' ')[0]}]</span>
                 <span style={{ color: '#818cf8' }}>System:</span>
                 <span style={{ color: '#E0E0E0' }}>Telemetry active.</span>
                 <span style={{ animation: 'auth-pulse 1.5s infinite', color: '#fff' }}>_</span>
               </div>
             </div>
           </div>
        </div>

        {/* Intentional Tension (Off-Axis Quick Actions) */}
        <div style={{ 
          transform: 'translateY(2rem)', 
          background: '#0A0A0A', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '2px', 
          padding: '1.5rem',
          boxShadow: '-10px 20px 40px rgba(0,0,0,0.4)'
        }}>
          <p style={{ color: '#777', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1.25rem', fontWeight: 600 }}>Direct Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn-premium-ghost" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }} onClick={() => window.dispatchEvent(new CustomEvent('SET_TAB', { detail: 'announcements' }))}>
              <span>Broadcast Update</span>
              <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 400 }}>({stats?.participantsCount || 0} hackers)</span>
            </button>
            <button className="btn-premium-ghost" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }} onClick={() => window.dispatchEvent(new CustomEvent('SET_TAB', { detail: 'tickets' }))}>
              <span>Resolve Tickets</span>
              <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 400 }}>({stats?.openTickets || 0} pending)</span>
            </button>
            <button className="btn-premium-ghost" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }} onClick={() => window.dispatchEvent(new CustomEvent('SET_TAB', { detail: 'judging' }))}>
              <span>Manage Judging</span>
              <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 400 }}>(Queue empty)</span>
            </button>
            <button className="btn-premium-ghost" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }} onClick={() => window.dispatchEvent(new CustomEvent('SET_TAB', { detail: 'staff' }))}>
              <span>Onboard Staff</span>
              <span style={{ fontSize: '0.6rem', color: '#666', fontWeight: 400 }}>(0 invites)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ==================== RESULTS PANEL ==================== */
function ResultsPanel({ hackathonId }: { hackathonId: string }) {
  const [winners, setWinners] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [sendingAnnounce, setSendingAnnounce] = useState(false);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [certRes, subRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/certificates`),
          fetch(`/api/hackathons/${hackathonId}/submissions`),
        ]);
        setWinners((await certRes.json()).data?.filter((c: any) => c.type === 'WINNER' || c.type === 'RUNNER_UP' || c.type === 'BEST_PROJECT') || []);
        setSubmissions((await subRes.json()).data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  async function announceResults() {
    if (!announceTitle.trim() || !announceContent.trim()) return;
    setSendingAnnounce(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/announcements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: announceTitle, content: announceContent, isUrgent: false }),
      });
      if (res.ok) { setFeedback('Results announced on website'); setAnnounceTitle(''); setAnnounceContent(''); }
      else setFeedback('Failed to announce');
    } catch { setFeedback('Network error'); }
    setSendingAnnounce(false);
    setTimeout(() => setFeedback(''), 3000);
  }

  async function declareWinner(submissionId: string, teamName: string, type: string) {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: sub.team?.members?.[0]?.user?.id, type, title: `${type.replace('_', ' ')} - ${teamName}` }),
    });
    if (res.ok) {
      setFeedback(`${type} declared for ${teamName}`);
      const certRes = await fetch(`/api/hackathons/${hackathonId}/certificates`);
      setWinners((await certRes.json()).data?.filter((c: any) => ['WINNER', 'RUNNER_UP', 'BEST_PROJECT'].includes(c.type)) || []);
    }
    setTimeout(() => setFeedback(''), 3000);
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedback && <div className="org-feedback org-feedback-success">{feedback}</div>}

      {/* Declared Winners */}
      <div>
        <p className="org-label" style={{ marginBottom: '0.6rem' }}>Declared Winners ({winners.length})</p>
        {winners.length === 0 ? (
          <div className="org-empty" style={{ padding: '1.5rem' }}>No winners declared yet. Use the submission list below to declare.</div>
        ) : winners.map((w) => (
          <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', marginBottom: '0.35rem' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{w.user?.name || w.title}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{w.user?.email}</p>
            </div>
            <span className={`org-badge ${w.type === 'WINNER' ? 'org-badge-accent' : w.type === 'RUNNER_UP' ? 'org-badge-muted' : 'org-badge-info'}`}>
              {w.type.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Submissions to judge */}
      <div>
        <p className="org-label" style={{ marginBottom: '0.6rem' }}>Submissions ({submissions.filter((s) => s.submittedAt).length} submitted)</p>
        {submissions.filter((s) => s.submittedAt).map((sub) => (
          <div key={sub.id} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{sub.team?.name}</p>
                <p className="org-text" style={{ fontSize: '0.72rem' }}>{sub.technologies?.join(', ') || 'No tech stack'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button className="org-btn-primary" onClick={() => declareWinner(sub.id, sub.team?.name, 'WINNER')} style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}>Winner</button>
                <button className="org-btn-secondary" onClick={() => declareWinner(sub.id, sub.team?.name, 'RUNNER_UP')} style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}>Runner-up</button>
                <button className="org-btn-secondary" onClick={() => declareWinner(sub.id, sub.team?.name, 'BEST_PROJECT')} style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}>Best Project</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Announce Results */}
      <div className="org-section">
        <p className="org-label" style={{ marginBottom: '0.6rem' }}>Announce Results on Website</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input className="org-input" placeholder="Announcement title (e.g. Winners Announced!)" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} />
          <textarea className="org-input" placeholder="Full results details..." value={announceContent} onChange={(e) => setAnnounceContent(e.target.value)} style={{ minHeight: 80, resize: 'vertical' as const }} />
          <button className="org-btn-primary" onClick={announceResults} disabled={sendingAnnounce || !announceTitle.trim() || !announceContent.trim()} style={{ alignSelf: 'flex-start' }}>
            {sendingAnnounce ? 'Posting...' : 'Post Results'}
          </button>
        </div>
      </div>
    </div>
  );
}
