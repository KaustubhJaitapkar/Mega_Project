'use client';

import Link from 'next/link';

interface HackathonCardProps {
  hackathon: {
    id: string; title: string; description: string;
    shortDescription?: string;
    bannerUrl?: string;
    logoUrl?: string;
    startDate: string; endDate: string; location?: string; isVirtual: boolean;
    _count: { teams: number; submissions: number };
  };
}

function stripRichText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  const summarySource = hackathon.shortDescription || hackathon.description;
  const summary = stripRichText(summarySource);

  return (
    <Link href={`/participant/hackathons/${hackathon.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', transition: 'border-color 0.2s',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%',
        overflow: 'hidden',
      }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
      >
        <div style={{
          position: 'relative',
          height: 128,
          background: hackathon.bannerUrl
            ? `url(${hackathon.bannerUrl}) center / cover no-repeat`
            : 'linear-gradient(135deg, var(--accent-dim), rgba(129, 140, 248, 0.12))',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,8,10,0.68), rgba(8,8,10,0.08))',
          }} />
          <span className="org-badge org-badge-muted" style={{
            position: 'absolute',
            right: 10,
            top: 10,
          }}>
            {hackathon.isVirtual ? 'Virtual' : 'In-person'}
          </span>
        </div>

        <div style={{ padding: '1rem 1.1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.65rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-raised)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: -22,
            }}>
              {hackathon.logoUrl ? (
                <img src={hackathon.logoUrl} alt={`${hackathon.title} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                  {hackathon.title.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {hackathon.title}
            </h3>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '0.85rem', minHeight: 40 }}>
            {summary.length > 130 ? `${summary.slice(0, 130)}...` : summary || 'No description provided yet.'}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            <span>{new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="org-badge org-badge-info">{hackathon._count.teams} teams</span>
            <span className="org-badge org-badge-success">{hackathon._count.submissions} subs</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
