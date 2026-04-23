'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const SKILL_SUGGESTIONS = ['React', 'Next.js', 'Node.js', 'Python', 'TypeScript', 'Machine Learning', 'UI/UX', 'Docker', 'PostgreSQL', 'Firebase', 'Rust', 'Go', 'Swift', 'Kotlin', 'Figma'];

export default function ParticipantProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    name: '', college: '', yearOfStudy: '', bio: '',
    skills: [] as string[], githubUsername: '', githubUrl: '', linkedinUrl: '', resumeUrl: '',
    sponsorVisible: true, isLookingForTeam: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/profile');
        const { user } = await res.json();
        const p = user?.profile || {};
        setForm({
          name: user?.name || '', college: p.company || '', yearOfStudy: p.experience || '',
          bio: p.bio || '', skills: p.skills || [], githubUsername: user?.githubUsername || '',
          githubUrl: p.githubUrl || '', linkedinUrl: p.linkedinUrl || '', resumeUrl: p.resumeUrl || '',
          sponsorVisible: p.isPublic ?? true, isLookingForTeam: p.isLookingForTeam ?? false,
        });
      } catch { setError('Failed to load profile'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = SKILL_SUGGESTIONS.filter((s) => s.toLowerCase().includes(skillInput.toLowerCase()) && !form.skills.includes(s));

  function addSkill(skill: string) {
    if (!skill.trim() || form.skills.includes(skill) || form.skills.length >= 15) return;
    setForm((p) => ({ ...p, skills: [...p.skills, skill.trim()] }));
    setSkillInput('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess(''); setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) setSuccess('Profile saved');
      else setError(data.error || 'Save failed');
    } catch { setError('Network error'); }
    finally { setIsSaving(false); }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Settings</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Profile</h1>
        <p className="org-text" style={{ marginTop: '0.35rem' }}>Complete your profile for team discovery and sponsor visibility.</p>
      </div>

      {error && <div className="org-feedback org-feedback-error">{error}</div>}
      {success && <div className="org-feedback org-feedback-success">{success}</div>}

      <form onSubmit={handleSave}>
        {/* Identity */}
        <div className="org-section" style={{ marginBottom: '0.75rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Identity</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Full Name</label>
              <input className="org-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>College</label>
              <input className="org-input" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Year of Study</label>
            <input className="org-input" value={form.yearOfStudy} onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })} placeholder="e.g. Final year, 3rd year" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Bio</label>
            <textarea className="org-input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ minHeight: 80, resize: 'vertical' as const }} placeholder="Tell teams and sponsors about yourself..." />
          </div>
        </div>

        {/* Skills */}
        <div className="org-section" style={{ marginBottom: '0.75rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Skills ({form.skills.length}/15)</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <input className="org-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Type a skill..." style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); }}} />
            <button type="button" className="org-btn-secondary" onClick={() => addSkill(skillInput)}>Add</button>
          </div>
          {filtered.length > 0 && skillInput && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
              {filtered.slice(0, 6).map((s) => (
                <button key={s} type="button" onClick={() => addSkill(s)} style={{
                  padding: '0.2rem 0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {form.skills.map((skill) => (
              <span key={skill} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.25rem 0.55rem', background: 'var(--accent-dim)', border: '1px solid rgba(232,164,74,0.2)',
                borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 500,
              }}>
                {skill}
                <button type="button" onClick={() => setForm((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))} style={{
                  background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0, lineHeight: 1,
                }}>&times;</button>
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="org-section" style={{ marginBottom: '0.75rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Links</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>GitHub Username</label>
              <input className="org-input" value={form.githubUsername} onChange={(e) => setForm({ ...form, githubUsername: e.target.value })} placeholder="octocat" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>GitHub URL</label>
              <input className="org-input" type="url" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/you" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>LinkedIn</label>
              <input className="org-input" type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/you" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Resume</label>
              <input className="org-input" type="url" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} placeholder="https://drive.google.com/..." />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="org-section" style={{ marginBottom: '1rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Preferences</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '0.6rem' }}>
            <div className={`org-toggle ${form.isLookingForTeam ? 'org-toggle--active' : ''}`} onClick={() => setForm((p) => ({ ...p, isLookingForTeam: !p.isLookingForTeam }))}>
              <div className="org-toggle-thumb" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Looking for a team</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Show yourself in team discovery feed</p>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
            <div className={`org-toggle ${form.sponsorVisible ? 'org-toggle--active' : ''}`} onClick={() => setForm((p) => ({ ...p, sponsorVisible: !p.sponsorVisible }))}>
              <div className="org-toggle-thumb" />
            </div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>Sponsor visibility</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Appear in sponsor talent pool</p>
            </div>
          </label>
        </div>

        <button type="submit" disabled={isSaving} className="org-btn-primary" style={{ width: '100%', padding: '0.7rem', fontSize: '0.78rem' }}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
