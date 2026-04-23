'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

export default function ParticipantSubmitPage() {
  const [teamId, setTeamId] = useState('');
  const [submission, setSubmission] = useState<any>(null);
  const [form, setForm] = useState({ githubUrl: '', liveUrl: '', description: '', technologies: [] as string[] });
  const [tech, setTech] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'healthy' | 'broken'>('idle');
  const [issues, setIssues] = useState<string[]>([]);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await fetch('/api/users/profile').then((r) => r.json());
      const userId = profile.user?.id;
      const hacks = await fetch('/api/hackathons?limit=50').then((r) => r.json());
      for (const h of hacks.data || []) {
        const teams = await fetch(`/api/hackathons/${h.id}/teams`).then((r) => r.json());
        const mine = (teams.data || []).find((t: any) => t.members.some((m: any) => m.user.id === userId));
        if (mine) {
          setTeamId(mine.id);
          setDeadlinePassed(new Date() > new Date(h.submissionDeadline));
          return;
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!teamId) return;
    (async () => {
      const res = await fetch(`/api/teams/${teamId}/submission`);
      const data = await res.json();
      setSubmission(data.data);
      if (data.data) {
        setForm({
          githubUrl: data.data.githubUrl || '', liveUrl: data.data.liveUrl || '',
          description: data.data.description || '', technologies: data.data.technologies || [],
        });
      }
    })();
    const timer = setInterval(async () => {
      const res = await fetch(`/api/teams/${teamId}/submission`);
      setSubmission((await res.json()).data);
    }, 5000);
    return () => clearInterval(timer);
  }, [teamId]);

  async function saveSubmission() {
    if (!teamId) return;
    if (form.githubUrl && !/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(form.githubUrl)) { setIssues(['GitHub URL must be a repository link']); return; }
    if (form.description.length < 20) { setIssues(['Description needs at least 20 characters']); return; }
    setSaving(true); setStatus('checking');
    const res = await fetch(`/api/teams/${teamId}/submission`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setSubmission(data.data); setIssues(data.issues || []); setStatus(data.healthStatus === 'healthy' ? 'healthy' : 'broken'); }
    else { setIssues([data.error || 'Failed']); setStatus('broken'); }
    setSaving(false);
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Project</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Submit</h1>
        <p className="org-text" style={{ marginTop: '0.35rem' }}>Submit your project links and description for judging.</p>
      </div>

      {deadlinePassed && <div className="org-feedback org-feedback-error">Submission deadline has passed. Form is locked.</div>}

      {!teamId ? (
        <div className="org-empty" style={{ padding: '3rem' }}>Join or create a team first to submit a project.</div>
      ) : (
        <>
          <div className="org-section" style={{ marginBottom: '0.75rem' }}>
            <p className="org-label" style={{ marginBottom: '0.75rem' }}>Project Details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>GitHub Repository</label>
                <input className="org-input" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} disabled={deadlinePassed} placeholder="https://github.com/user/repo" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Live Demo URL</label>
                <input className="org-input" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} disabled={deadlinePassed} placeholder="https://your-project.vercel.app" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Description</label>
                <textarea className="org-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={deadlinePassed} style={{ minHeight: 100, resize: 'vertical' as const }} placeholder="Describe what your project does and how it works..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Technologies</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="org-input" value={tech} onChange={(e) => setTech(e.target.value)} disabled={deadlinePassed} placeholder="e.g. React, Python" style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (tech.trim() && !form.technologies.includes(tech.trim())) { setForm((p) => ({ ...p, technologies: [...p.technologies, tech.trim()] })); setTech(''); }}}} />
                  <button type="button" className="org-btn-secondary" disabled={deadlinePassed} onClick={() => { if (tech.trim() && !form.technologies.includes(tech.trim())) { setForm((p) => ({ ...p, technologies: [...p.technologies, tech.trim()] })); setTech(''); }}}>Add</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.5rem' }}>
                  {form.technologies.map((t) => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.2rem 0.5rem', background: 'var(--accent-dim)', border: '1px solid rgba(232,164,74,0.2)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.72rem',
                    }}>
                      {t}
                      {!deadlinePassed && <button type="button" onClick={() => setForm((p) => ({ ...p, technologies: p.technologies.filter((x) => x !== t) }))} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>&times;</button>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={saveSubmission} disabled={deadlinePassed || saving} className="org-btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '0.65rem' }}>
              {saving ? 'Checking & saving...' : 'Save Submission'}
            </button>
          </div>

          {/* Status */}
          <div className="org-section">
            <p className="org-label" style={{ marginBottom: '0.6rem' }}>Status</p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {status === 'healthy' ? <CheckCircle style={{ width: 16, height: 16, color: '#3ecf8e' }} /> :
                 status === 'broken' ? <AlertCircle style={{ width: 16, height: 16, color: '#ef4444' }} /> :
                 <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-default)' }} />}
                <span style={{ fontSize: '0.82rem', color: status === 'healthy' ? '#3ecf8e' : status === 'broken' ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize' }}>{status === 'idle' ? 'Not checked' : status}</span>
              </div>
              <span className={`org-badge ${submission?.status === 'SUBMITTED' ? 'org-badge-success' : 'org-badge-muted'}`}>{submission?.status || 'DRAFT'}</span>
              {submission?.githubUrl && <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent)', fontSize: '0.72rem', textDecoration: 'none' }}><ExternalLink style={{ width: 12, height: 12 }} />GitHub</a>}
              {submission?.liveUrl && <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: 'var(--accent)', fontSize: '0.72rem', textDecoration: 'none' }}><ExternalLink style={{ width: 12, height: 12 }} />Live</a>}
            </div>
            {issues.length > 0 && (
              <div style={{ marginTop: '0.6rem' }}>
                {issues.map((i) => <p key={i} style={{ fontSize: '0.78rem', color: '#ef4444', marginBottom: '0.2rem' }}>&#8226; {i}</p>)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
