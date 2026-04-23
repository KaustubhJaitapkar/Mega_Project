'use client';

import { useState } from 'react';
import { Lock, Clock, Trophy, RefreshCw } from 'lucide-react';

interface Props { hackathonId: string }

const ACTIONS = [
  { id: 'LOCK_SUBMISSIONS', label: 'Lock Submissions', desc: 'Prevent new submissions', icon: Lock, color: '#ef4444' },
  { id: 'OPEN_JUDGING', label: 'Open Judging', desc: 'Allow judges to score', icon: Trophy, color: '#3ecf8e' },
] as const;

export default function QuickActions({ hackathonId }: Props) {
  const [loading, setLoading] = useState('');
  const [feedback, setFeedback] = useState('');
  const [extendDate, setExtendDate] = useState('');
  const [showExtend, setShowExtend] = useState(false);

  async function execute(action: string, body?: any) {
    setLoading(action); setFeedback('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/quick-actions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      setFeedback(res.ok ? (data.message || 'Action completed') : (data.error || 'Failed'));
    } catch { setFeedback('Network error'); }
    setLoading('');
  }

  async function extendDeadline() {
    if (!extendDate) return;
    await execute('EXTEND_DEADLINE', { submissionDeadline: new Date(extendDate).toISOString() });
    setExtendDate(''); setShowExtend(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedback && <div className={`org-feedback ${feedback.includes('completed') || feedback.includes('Done') ? 'org-feedback-success' : 'org-feedback-error'}`}>{feedback}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="org-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon style={{ width: 16, height: 16, color: a.color }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{a.label}</p>
              </div>
              <p className="org-text" style={{ fontSize: '0.75rem' }}>{a.desc}</p>
              <button className="org-btn-secondary" onClick={() => execute(a.id)} disabled={!!loading} style={{ alignSelf: 'flex-start' }}>
                {loading === a.id ? <><RefreshCw style={{ width: 12, height: 12, animation: 'auth-spin 0.8s linear infinite' }} />Running...</> : 'Execute'}
              </button>
            </div>
          );
        })}

        {/* Extend Deadline */}
        <div className="org-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock style={{ width: 16, height: 16, color: '#e8a44a' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>Extend Deadline</p>
          </div>
          <p className="org-text" style={{ fontSize: '0.75rem' }}>Push the submission deadline forward.</p>
          {!showExtend ? (
            <button className="org-btn-secondary" onClick={() => setShowExtend(true)} style={{ alignSelf: 'flex-start' }}>Configure</button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="datetime-local" className="org-input" value={extendDate} onChange={(e) => setExtendDate(e.target.value)} style={{ flex: 1 }} />
              <button className="org-btn-primary" onClick={extendDeadline} disabled={loading === 'EXTEND_DEADLINE' || !extendDate}>
                {loading === 'EXTEND_DEADLINE' ? '...' : 'Apply'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
