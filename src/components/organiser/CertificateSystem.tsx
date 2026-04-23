'use client';

import { useState, useEffect } from 'react';
import { Award, Download, RefreshCw, Zap, User, Trophy } from 'lucide-react';

interface Certificate {
  id: string; type: string; title: string | null;
  certificateUrl: string | null; pdfPath: string | null; issuedAt: string;
  user: { id: string; name: string; email: string };
}

interface Props { hackathonId: string }

export default function CertificateSystem({ hackathonId }: Props) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [userId, setUserId] = useState('');
  const [certType, setCertType] = useState('PARTICIPANT');

  const load = async () => {
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/certificates`);
      setCertificates((await res.json()).data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { if (hackathonId) load(); }, [hackathonId]);

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 4000); };

  async function autoGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'auto' }),
      });
      const data = await res.json();
      showFeedback(res.ok ? `Generated ${data.data?.length || 0} certificates` : (data.error || 'Failed'));
      if (res.ok) load();
    } catch { showFeedback('Failed'); }
    setGenerating(false);
  }

  async function generateOne() {
    if (!userId.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: certType }),
      });
      const data = await res.json();
      showFeedback(res.ok ? 'Certificate generated' : (data.error || 'Failed'));
      if (res.ok) { setUserId(''); load(); }
    } catch { showFeedback('Failed'); }
    setGenerating(false);
  }

  const typeColors: Record<string, string> = {
    WINNER: '#e8a44a', RUNNER_UP: '#94a3b8', PARTICIPANT: '#3ecf8e', BEST_PROJECT: '#818cf8',
  };

  const typeIcon = (type: string) => {
    if (type === 'WINNER') return <Trophy style={{ width: 14, height: 14, color: '#e8a44a' }} />;
    if (type === 'RUNNER_UP') return <Award style={{ width: 14, height: 14, color: '#94a3b8' }} />;
    return <User style={{ width: 14, height: 14, color: '#3ecf8e' }} />;
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedback && <div className={`org-feedback ${feedback.includes('Generated') || feedback.includes('generated') ? 'org-feedback-success' : 'org-feedback-error'}`}>{feedback}</div>}

      {/* Auto-generate */}
      <div className="org-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Zap style={{ width: 16, height: 16, color: 'var(--accent)' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Auto-Generate All</p>
        </div>
        <p className="org-text" style={{ marginBottom: '0.75rem' }}>Create certificates for all participants, winners, and runners-up automatically.</p>
        <button className="org-btn-primary" onClick={autoGenerate} disabled={generating}>
          {generating ? <><RefreshCw style={{ width: 14, height: 14, animation: 'auth-spin 0.8s linear infinite' }} />Generating...</> : <><Award style={{ width: 14, height: 14 }} />Generate All</>}
        </button>
      </div>

      {/* Individual */}
      <div className="org-section">
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: '0.6rem' }}>Generate Individual</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="org-input" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ flex: 1 }} />
          <select className="org-select" value={certType} onChange={(e) => setCertType(e.target.value)} style={{ width: 140 }}>
            <option value="PARTICIPANT">Participant</option>
            <option value="WINNER">Winner</option>
            <option value="RUNNER_UP">Runner Up</option>
            <option value="BEST_PROJECT">Best Project</option>
          </select>
          <button className="org-btn-primary" onClick={generateOne} disabled={generating || !userId.trim()}>Generate</button>
        </div>
      </div>

      {/* List */}
      <div>
        <p className="org-label" style={{ marginBottom: '0.75rem' }}>Generated ({certificates.length})</p>
        {certificates.length === 0 ? (
          <div className="org-empty"><Award style={{ width: 28, height: 28, margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No certificates generated yet</p></div>
        ) : certificates.map((cert) => {
          const color = typeColors[cert.type] || '#94a3b8';
          return (
            <div key={cert.id} className="org-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {typeIcon(cert.type)}
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{cert.user.name}</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{cert.user.email}</p>
                </div>
                <span className="org-badge" style={{ background: `${color}18`, color }}>{cert.type.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{new Date(cert.issuedAt).toLocaleDateString()}</span>
                {(cert.pdfPath || cert.certificateUrl) && (
                  <a href={cert.pdfPath || cert.certificateUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent)', fontSize: '0.72rem', textDecoration: 'none' }}>
                    <Download style={{ width: 12, height: 12 }} />PDF
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
