'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle, XCircle, Clock, RefreshCw, FileText } from 'lucide-react';

interface Submission {
  id: string; githubUrl: string | null; liveUrl: string | null; status: string;
  isHealthy: boolean | null; healthCheckAt: string | null; submittedAt: string | null;
  description: string | null; technologies: string[];
  team: { id: string; name: string; members: Array<{ user: { name: string } }> };
}

interface Props { hackathonId: string }

export default function SubmissionMonitoring({ hackathonId }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'healthy' | 'broken'>('all');

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/submissions`);
        setSubmissions((await res.json()).data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  const filtered = submissions.filter((s) => {
    if (filter === 'submitted') return s.submittedAt;
    if (filter === 'healthy') return s.isHealthy === true;
    if (filter === 'broken') return s.isHealthy === false;
    return true;
  });

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} /></div>;

  const healthIcon = (healthy: boolean | null) => {
    if (healthy === true) return <CheckCircle style={{ width: 14, height: 14, color: '#3ecf8e' }} />;
    if (healthy === false) return <XCircle style={{ width: 14, height: 14, color: '#ef4444' }} />;
    return <Clock style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {(['all', 'submitted', 'healthy', 'broken'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'org-btn-primary' : 'org-btn-secondary'} style={{ textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="org-empty"><FileText style={{ width: 28, height: 28, margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No submissions found</p></div>
      ) : filtered.map((sub) => (
        <div key={sub.id} className="org-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{sub.team.name}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub.team.members.map((m) => m.user.name).join(', ')}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {healthIcon(sub.isHealthy)}
              <span className={`org-badge ${sub.submittedAt ? 'org-badge-success' : 'org-badge-muted'}`}>{sub.submittedAt ? 'submitted' : 'draft'}</span>
            </div>
          </div>
          {sub.description && <p className="org-text" style={{ marginBottom: '0.5rem' }}>{sub.description}</p>}
          {sub.technologies?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
              {sub.technologies.map((t) => <span key={t} className="org-badge org-badge-info">{t}</span>)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {sub.githubUrl && <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.75rem', textDecoration: 'none' }}><ExternalLink style={{ width: 12, height: 12 }} />GitHub</a>}
            {sub.liveUrl && <a href={sub.liveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.75rem', textDecoration: 'none' }}><ExternalLink style={{ width: 12, height: 12 }} />Live</a>}
          </div>
        </div>
      ))}
    </div>
  );
}
