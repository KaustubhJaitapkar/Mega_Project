'use client';

import { useState, useEffect } from 'react';
import { Trophy, Eye, EyeOff, Lock, Plus, RefreshCw } from 'lucide-react';

interface RubricItem { name: string; description: string; maxScore: number }
interface Rubric { id: string; name: string; description: string; maxScore: number; isActive: boolean; items: Array<RubricItem & { id: string }> }
interface Props { hackathonId: string }

export default function JudgingControl({ hackathonId }: Props) {
  const [judgingOpen, setJudgingOpen] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const showFeedback = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [jcRes, rubRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/judging-control`),
          fetch(`/api/hackathons/${hackathonId}/rubrics`),
        ]);
        const jcData = await jcRes.json();
        const rubData = await rubRes.json();
        setJudgingOpen(!!jcData.data?.judgingOpen);
        setBlindMode(!!jcData.data?.blindMode);
        setRubrics(rubData.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  async function toggleJudging() {
    const next = !judgingOpen;
    const res = await fetch(`/api/hackathons/${hackathonId}/judging-control`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ judgingOpen: next }),
    });
    if (res.ok) { setJudgingOpen(next); showFeedback(next ? 'Judging opened' : 'Judging closed'); }
  }

  async function toggleBlind() {
    const next = !blindMode;
    const res = await fetch(`/api/hackathons/${hackathonId}/judging-control`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blindMode: next }),
    });
    if (res.ok) { setBlindMode(next); showFeedback(next ? 'Blind mode enabled' : 'Blind mode disabled'); }
  }

  async function createDefaultRubric() {
    const res = await fetch(`/api/hackathons/${hackathonId}/rubrics`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Default Rubric', description: 'Standard judging criteria', maxScore: 100,
        items: [
          { name: 'Innovation', description: 'Creativity and originality', maxScore: 10 },
          { name: 'Execution', description: 'Technical implementation', maxScore: 10 },
          { name: 'Impact', description: 'Potential real-world impact', maxScore: 10 },
        ],
      }),
    });
    const data = await res.json();
    if (res.ok) { setRubrics((prev) => [data.data, ...prev]); showFeedback('Rubric created'); }
    else showFeedback(data.error || 'Failed');
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedback && <div className="org-feedback org-feedback-success">{feedback}</div>}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div className="org-section" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Judging Round</p>
              <p className="org-text" style={{ fontSize: '0.75rem' }}>{judgingOpen ? 'Accepting scores' : 'Scores locked'}</p>
            </div>
            <button className={judgingOpen ? 'org-btn-danger' : 'org-btn-primary'} onClick={toggleJudging}>
              {judgingOpen ? <><Lock style={{ width: 14, height: 14 }} />Close</> : <><Trophy style={{ width: 14, height: 14 }} />Open</>}
            </button>
          </div>
        </div>
        <div className="org-section" style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Blind Mode</p>
              <p className="org-text" style={{ fontSize: '0.75rem' }}>{blindMode ? 'Team names hidden' : 'Team names visible'}</p>
            </div>
            <button className="org-btn-secondary" onClick={toggleBlind}>
              {blindMode ? <><EyeOff style={{ width: 14, height: 14 }} />Disable</> : <><Eye style={{ width: 14, height: 14 }} />Enable</>}
            </button>
          </div>
        </div>
      </div>

      {/* Rubrics */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p className="org-label">Rubrics ({rubrics.length})</p>
          <button className="org-btn-primary" onClick={createDefaultRubric}><Plus style={{ width: 14, height: 14 }} />Create Default</button>
        </div>
        {rubrics.length === 0 ? (
          <div className="org-empty"><Trophy style={{ width: 24, height: 24, margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No rubrics yet</p></div>
        ) : rubrics.map((r) => (
          <div key={r.id} className="org-section" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{r.name}</p>
              <span className={`org-badge ${r.isActive ? 'org-badge-success' : 'org-badge-muted'}`}>{r.isActive ? 'active' : 'inactive'}</span>
            </div>
            {r.items?.map((item) => (
              <div key={item.id || item.name} className="org-row" style={{ paddingLeft: '0.5rem' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{item.name}</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <span className="org-badge org-badge-muted">max: {item.maxScore}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
