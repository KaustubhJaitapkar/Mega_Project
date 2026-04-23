'use client';

import { useEffect, useState } from 'react';

export default function SponsorDashboardPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState<'discover' | 'engage' | 'branding'>('discover');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (skill) params.set('skill', skill);
    (async () => {
      try {
        const res = await fetch(`/api/sponsor/participants?${params.toString()}`);
        setParticipants((await res.json()).data || []);
      } catch { /* silent */ }
    })();
  }, [search, skill]);

  const showNotice = (msg: string) => { setNotice(msg); setTimeout(() => setNotice(''), 3000); };

  async function sendSponsorMessage(hackathonId: string, title: string, content: string) {
    const res = await fetch('/api/sponsor/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hackathonId, title, content }),
    });
    showNotice(res.ok ? 'Broadcast sent' : 'Failed');
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Sponsor</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Dashboard</h1>
        <p className="org-text" style={{ marginTop: '0.35rem' }}>Discover opt-in participants and drive engagement.</p>
      </div>

      {notice && <div className="org-feedback org-feedback-success">{notice}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.75rem' }}>
        {[
          { id: 'discover' as const, label: 'Participant Discovery' },
          { id: 'engage' as const, label: 'Engagement' },
          { id: 'branding' as const, label: 'Branding' },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            border: '1px solid', borderColor: activeTab === t.id ? 'var(--accent)' : 'var(--border-default)',
            background: activeTab === t.id ? 'var(--accent)' : 'var(--bg-raised)',
            color: activeTab === t.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
            borderRadius: 999, padding: '0.4rem 0.85rem', fontFamily: 'var(--font-display)',
            fontSize: '0.72rem', cursor: 'pointer', fontWeight: activeTab === t.id ? 700 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Discovery Tab */}
      {activeTab === 'discover' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input className="org-input" placeholder="Search participants..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1 }} />
            <input className="org-input" placeholder="Filter by skill..." value={skill} onChange={(e) => setSkill(e.target.value)} style={{ maxWidth: 200 }} />
          </div>
          {participants.length === 0 ? (
            <div className="org-empty" style={{ padding: '3rem' }}>No opt-in participants match your filters.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
              {participants.map((p) => (
                <div key={p.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{p.name}</p>
                  <p className="org-text" style={{ marginBottom: '0.5rem' }}>{p.profile?.bio || 'No bio provided'}</p>
                  {p.profile?.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                      {p.profile.skills.map((s: string) => <span key={s} className="org-badge org-badge-info">{s}</span>)}
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {p.profile?.company && <span>{p.profile.company} &middot; </span>}
                    {p.githubUsername && <span>github.com/{p.githubUsername}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Engagement Tab */}
      {activeTab === 'engage' && <EngagementPanel onSend={sendSponsorMessage} />}

      {/* Branding Tab */}
      {activeTab === 'branding' && <BrandingPanel onSave={showNotice} />}
    </div>
  );
}

function EngagementPanel({ onSend }: { onSend: (hId: string, title: string, content: string) => void }) {
  const [hId, setHId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  return (
    <div className="org-section" style={{ maxWidth: 600 }}>
      <p className="org-label" style={{ marginBottom: '0.75rem' }}>Broadcast Opportunity</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <input className="org-input" placeholder="Hackathon ID" value={hId} onChange={(e) => setHId(e.target.value)} />
        <input className="org-input" placeholder="Title (e.g. Hiring Challenge)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="org-input" placeholder="Describe the opportunity..." value={content} onChange={(e) => setContent(e.target.value)} style={{ minHeight: 100, resize: 'vertical' as const }} />
        <button className="org-btn-primary" onClick={() => { onSend(hId, title, content); setHId(''); setTitle(''); setContent(''); }} disabled={!hId || !title || !content}>Send Broadcast</button>
      </div>
    </div>
  );
}

function BrandingPanel({ onSave }: { onSave: (msg: string) => void }) {
  const [logo, setLogo] = useState('');
  const [tier, setTier] = useState('title');
  return (
    <div className="org-section" style={{ maxWidth: 600 }}>
      <p className="org-label" style={{ marginBottom: '0.75rem' }}>Branding Settings</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Logo URL</label>
          <input className="org-input" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://your-company.com/logo.png" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Sponsorship Tier</label>
          <select className="org-select" value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="title">Title Sponsor</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
          </select>
        </div>
        <button className="org-btn-primary" onClick={async () => {
          const res = await fetch('/api/sponsor/branding', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logoUrl: logo, tier }),
          });
          onSave(res.ok ? 'Branding saved' : 'Save failed');
        }}>Save Branding</button>
      </div>
    </div>
  );
}
