'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  _count?: { teams: number; submissions: number };
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#64748b',
  published: '#818cf8',
  registration: '#38bdf8',
  ongoing: '#3ecf8e',
  judging: '#e8a44a',
  ended: '#64748b',
};

export default function OrganiserDashboardPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/hackathons');
        const data = await res.json();
        setHackathons(data.data || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    fetchHackathons();
  }, []);

  const totalTeams = hackathons.reduce((a, h) => a + (h._count?.teams || 0), 0);
  const totalSubs = hackathons.reduce((a, h) => a + (h._count?.submissions || 0), 0);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase',
            letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem',
          }}>
            Organiser
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 2vw, 1.8rem)',
            fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em',
          }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Manage your hackathons, teams, and submissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/organiser/scan" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)',
            fontSize: '0.72rem', letterSpacing: '0.03em', textDecoration: 'none', transition: 'all 0.15s',
          }}>
            QR Scanner
          </Link>
          <Link href="/create" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1rem', background: 'var(--accent)', border: 'none',
            borderRadius: 'var(--radius-md)', color: 'var(--text-inverse)', fontFamily: 'var(--font-display)',
            fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textDecoration: 'none', transition: 'all 0.15s',
          }}>
            + Create Hackathon
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Hackathons', value: hackathons.length, color: 'var(--accent)' },
          { label: 'Total Teams', value: totalTeams, color: '#818cf8' },
          { label: 'Submissions', value: totalSubs, color: '#3ecf8e' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem',
            borderLeft: `3px solid ${stat.color}`,
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '0.65rem', textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-muted)',
            }}>
              {stat.label}
            </p>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700,
              color: stat.color, marginTop: '0.25rem',
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Hackathon List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{
            width: 28, height: 28, border: '2px solid var(--border-subtle)',
            borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite',
          }} />
        </div>
      ) : hackathons.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No hackathons created yet.
          </p>
          <Link href="/create" style={{
            display: 'inline-flex', padding: '0.6rem 1.5rem', background: 'var(--accent)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-inverse)', fontFamily: 'var(--font-display)',
            fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
          }}>
            Create Your First Hackathon
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.75rem' }}>
          {hackathons.map((h) => {
            const statusColor = STATUS_COLORS[h.status?.toLowerCase()] || '#64748b';
            return (
              <div key={h.id} style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)', padding: '1.25rem', transition: 'border-color 0.2s',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700,
                    color: 'var(--text-primary)', flex: 1, marginRight: '0.5rem',
                  }}>
                    {h.title}
                  </h3>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.6rem', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                    padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)',
                    background: `${statusColor}18`, color: statusColor, whiteSpace: 'nowrap',
                  }}>
                    {h.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Teams</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h._count?.teams || 0}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Subs</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h._count?.submissions || 0}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dates</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(h.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(h.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <Link href={`/organiser/command-center/${h.id}`} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0.5rem', background: 'var(--accent)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-inverse)', fontFamily: 'var(--font-display)', fontSize: '0.7rem',
                    fontWeight: 700, textDecoration: 'none', letterSpacing: '0.03em', transition: 'opacity 0.15s',
                  }}>
                    Command Center
                  </Link>
                  <button
                    onClick={() => window.open(`/api/hackathons/${h.id}/export`, '_blank')}
                    style={{
                      padding: '0.5rem 0.75rem', background: 'var(--bg-raised)',
                      border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', fontSize: '0.7rem',
                      cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                  >
                    CSV
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
