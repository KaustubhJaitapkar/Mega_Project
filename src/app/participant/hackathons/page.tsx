'use client';

import { useEffect, useState } from 'react';
import HackathonCard from '@/components/HackathonCard';

interface Hackathon {
  id: string; title: string; description: string;
  shortDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  startDate: string; endDate: string; location?: string; isVirtual: boolean;
  _count: { teams: number; submissions: number };
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

export default function ExploreHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/hackathons?limit=100');
        setHackathons((await res.json()).data || []);
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = hackathons.filter((h) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const descriptionText = stripRichText(h.shortDescription || h.description);
    return h.title.toLowerCase().includes(term) || descriptionText.toLowerCase().includes(term) || (h.location || '').toLowerCase().includes(term);
  });

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Discover</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Hackathons</h1>
          <p className="org-text" style={{ marginTop: '0.35rem' }}>Find and join upcoming events.</p>
        </div>
        <input className="org-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or location..." style={{ maxWidth: 280 }} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
          <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="org-empty" style={{ padding: '3rem' }}>No hackathons found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
          {filtered.map((h) => <HackathonCard key={h.id} hackathon={h} />)}
        </div>
      )}
    </div>
  );
}
