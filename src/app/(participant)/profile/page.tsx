'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    name: '', bio: '', skills: [] as string[], experience: '',
    company: '', website: '', linkedin: '', twitter: '', phone: '', country: '', timezone: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/profile');
        const data = await res.json();
        if (data.user?.profile) {
          setForm((prev) => ({ ...prev, name: data.user.name || '', ...data.user.profile }));
        }
      } catch { setError('Failed to load'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess(''); setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) setSuccess('Profile saved');
      else { const d = await res.json(); setError(d.error || 'Save failed'); }
    } catch { setError('Network error'); }
    finally { setIsSaving(false); }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Settings</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Profile</h1>
        <p className="org-text" style={{ marginTop: '0.35rem' }}>Manage your profile information.</p>
      </div>

      {error && <div className="org-feedback org-feedback-error">{error}</div>}
      {success && <div className="org-feedback org-feedback-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="org-section" style={{ marginBottom: '0.75rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Basic Info</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Name</label>
              <input className="org-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Bio</label>
              <textarea className="org-input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} style={{ minHeight: 80, resize: 'vertical' as const }} />
            </div>
          </div>
        </div>

        <div className="org-section" style={{ marginBottom: '0.75rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Skills ({form.skills.length})</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <input className="org-input" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add a skill..." style={{ flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (skillInput.trim() && !form.skills.includes(skillInput.trim())) { setForm((p) => ({ ...p, skills: [...p.skills, skillInput.trim()] })); setSkillInput(''); }}}}
            />
            <button type="button" className="org-btn-secondary" onClick={() => { if (skillInput.trim() && !form.skills.includes(skillInput.trim())) { setForm((p) => ({ ...p, skills: [...p.skills, skillInput.trim()] })); setSkillInput(''); }}}>Add</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {form.skills.map((skill) => (
              <span key={skill} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.25rem 0.55rem', background: 'var(--accent-dim)', border: '1px solid rgba(232,164,74,0.2)',
                borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontSize: '0.75rem',
              }}>
                {skill}
                <button type="button" onClick={() => setForm((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>&times;</button>
              </span>
            ))}
          </div>
        </div>

        <div className="org-section" style={{ marginBottom: '0.75rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Details</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Experience</label>
              <select className="org-select" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}>
                <option value="">Select level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-level</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Company</label>
              <input className="org-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Country</label>
              <input className="org-input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Timezone</label>
              <input className="org-input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="UTC-5" />
            </div>
          </div>
        </div>

        <div className="org-section" style={{ marginBottom: '1rem' }}>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Links</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Website</label>
              <input className="org-input" type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>LinkedIn</label>
              <input className="org-input" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Twitter</label>
              <input className="org-input" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="@handle" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Phone</label>
              <input className="org-input" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSaving} className="org-btn-primary" style={{ width: '100%', padding: '0.7rem', fontSize: '0.78rem' }}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
