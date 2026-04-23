'use client';

import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';

interface Stats {
  totalTeams: number; participantsCount: number; totalSubmissions: number;
  submittedCount: number; healthyCount: number; openTickets: number;
  totalAttendances: number; averageTeamSize: number; averageScore: number;
  teamDistribution: Record<string, number>;
  skillHeatmap: Array<{ skill: string; count: number }>;
}

interface Props { hackathonId: string }

export default function AnalyticsDashboard({ hackathonId }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/stats`);
        setStats((await res.json()).data || null);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} /></div>;
  if (!stats) return <div className="org-empty"><BarChart3 style={{ width: 32, height: 32, margin: '0 auto 0.75rem', opacity: 0.4 }} /><p>No analytics data available</p></div>;

  const statCards = [
    { label: 'Teams', value: stats.totalTeams, icon: Users, color: '#818cf8' },
    { label: 'Participants', value: stats.participantsCount, icon: Users, color: '#3ecf8e' },
    { label: 'Submissions', value: stats.submittedCount, icon: FileText, color: 'var(--accent)' },
    { label: 'Healthy', value: stats.healthyCount, icon: CheckCircle, color: '#3ecf8e' },
    { label: 'Tickets', value: stats.openTickets, icon: AlertCircle, color: '#e8a44a' },
    { label: 'Check-ins', value: stats.totalAttendances, icon: Users, color: '#38bdf8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="org-section" style={{ borderLeft: `3px solid ${s.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Icon style={{ width: 14, height: 14, color: s.color }} />
                <span className="org-label">{s.label}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {stats.teamDistribution && Object.keys(stats.teamDistribution).length > 0 && (
        <div className="org-section">
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Team Size Distribution</p>
          {Object.entries(stats.teamDistribution).map(([size, count]) => {
            const max = Math.max(...Object.values(stats.teamDistribution));
            return (
              <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', width: 70 }}>{size} members</span>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${max > 0 ? (count / max) * 100 : 0}%`, background: '#818cf8', borderRadius: 3, opacity: 0.6 }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {stats.skillHeatmap?.length > 0 && (
        <div className="org-section">
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Top Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {stats.skillHeatmap.map((item) => {
              const max = Math.max(...stats.skillHeatmap.map((s) => s.count));
              const intensity = max > 0 ? item.count / max : 0;
              return (
                <span key={item.skill} style={{
                  padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', fontWeight: 500,
                  background: `rgba(232,164,74,${0.08 + intensity * 0.15})`, color: `rgba(232,164,74,${0.6 + intensity * 0.4})`,
                  border: `1px solid rgba(232,164,74,${0.1 + intensity * 0.2})`,
                }}>
                  {item.skill} ({item.count})
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        <div className="org-section">
          <p className="org-label">Avg Team Size</p>
          <p className="org-value">{stats.averageTeamSize.toFixed(1)}</p>
        </div>
        <div className="org-section">
          <p className="org-label">Avg Score</p>
          <p className="org-value">{stats.averageScore.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
}
