'use client';

import { useState, useEffect } from 'react';
import { Users, RefreshCw } from 'lucide-react';

interface Team {
  id: string; name: string; description: string | null; status: string;
  isOpen: boolean; maxMembers: number;
  members: Array<{ id: string; role: string; user: { id: string; name: string; email: string } }>;
  submission: { id: string; status: string; isHealthy: boolean | null } | null;
  _count?: { joinRequests: number };
}

interface Props { hackathonId: string }

export default function TeamMonitoring({ hackathonId }: Props) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/teams`);
        setTeams((await res.json()).data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  const filtered = teams.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <input className="org-input" placeholder="Search teams..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
        <span className="org-label">{filtered.length} teams</span>
      </div>

      {filtered.length === 0 ? (
        <div className="org-empty"><Users style={{ width: 28, height: 28, margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No teams found</p></div>
      ) : filtered.map((team) => (
        <div key={team.id} className="org-section" style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === team.id ? null : team.id)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{team.name}</p>
              <p className="org-text" style={{ fontSize: '0.78rem' }}>{team.members.length}/{team.maxMembers} members &middot; {team.status}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {team.submission && (
                <span className={`org-badge ${team.submission.isHealthy === true ? 'org-badge-success' : team.submission.isHealthy === false ? 'org-badge-danger' : 'org-badge-muted'}`}>
                  {team.submission.isHealthy === true ? 'healthy' : team.submission.isHealthy === false ? 'broken' : 'checking'}
                </span>
              )}
              <span className="org-badge org-badge-muted">{expanded === team.id ? '\u25B2' : '\u25BC'}</span>
            </div>
          </div>
          {expanded === team.id && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
              <p className="org-label" style={{ marginBottom: '0.5rem' }}>Members</p>
              {team.members.map((m) => (
                <div key={m.id} className="org-row">
                  <div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{m.user.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{m.role}</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.user.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
