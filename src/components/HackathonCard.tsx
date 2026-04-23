'use client';

import Link from 'next/link';

interface HackathonCardProps {
  hackathon: {
    id: string; title: string; description: string;
    startDate: string; endDate: string; location?: string; isVirtual: boolean;
    _count: { teams: number; submissions: number };
  };
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  return (
    <Link href={`/participant/hackathons/${hackathon.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '1.25rem', transition: 'border-color 0.2s',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%',
      }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
          {hackathon.title}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem', flex: 1 }}>
          {hackathon.description.length > 100 ? hackathon.description.slice(0, 100) + '\u2026' : hackathon.description}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          <span>{new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2013 {new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <span className="org-badge org-badge-info">{hackathon._count.teams} teams</span>
          <span className="org-badge org-badge-success">{hackathon._count.submissions} subs</span>
          <span className="org-badge org-badge-muted">{hackathon.isVirtual ? 'Virtual' : 'In-person'}</span>
        </div>
      </div>
    </Link>
  );
}
