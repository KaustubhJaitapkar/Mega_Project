'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface MealConfig { breakfast: number; lunch: number; dinner: number }

export default function EditHackathonPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '', tagline: '', description: '', shortDescription: '',
    bannerUrl: '', logoUrl: '',
    startDate: '', endDate: '', registrationDeadline: '', submissionDeadline: '',
    isVirtual: true, location: '',
    maxTeamSize: 5, minTeamSize: 1,
    contactEmail: '', hostName: '', theme: '', eligibilityDomain: '',
    prize: '', rules: '',
  });

  const [status, setStatus] = useState('DRAFT');
  const [meals, setMeals] = useState({ breakfast: false, lunch: false, dinner: false, swag: false });
  const [mealFreq, setMealFreq] = useState<MealConfig>({ breakfast: 0, lunch: 0, dinner: 0 });

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}`);
        const data = await res.json();
        const h = data.data;
        if (!h) { setError('Hackathon not found'); return; }
        setForm({
          title: h.title || '', tagline: h.tagline || '', description: h.description || '',
          shortDescription: h.shortDescription || '', bannerUrl: h.bannerUrl || '', logoUrl: h.logoUrl || '',
          startDate: h.startDate ? toLocal(h.startDate) : '', endDate: h.endDate ? toLocal(h.endDate) : '',
          registrationDeadline: h.registrationDeadline ? toLocal(h.registrationDeadline) : '',
          submissionDeadline: h.submissionDeadline ? toLocal(h.submissionDeadline) : '',
          isVirtual: h.isVirtual, location: h.location || '',
          maxTeamSize: h.maxTeamSize, minTeamSize: h.minTeamSize,
          contactEmail: h.contactEmail || '', hostName: h.hostName || '',
          theme: h.theme || '', eligibilityDomain: h.eligibilityDomain || '',
          prize: h.prize || '', rules: h.rules || '',
        });
        setMeals({
          breakfast: h.breakfastProvided, lunch: h.lunchProvided,
          dinner: h.dinnerProvided, swag: h.swagProvided,
        });
        setStatus(h.status || 'DRAFT');

        // Calculate meal frequency from duration
        if (h.startDate && h.endDate) {
          const days = Math.max(1, Math.ceil((new Date(h.endDate).getTime() - new Date(h.startDate).getTime()) / 86400000));
          setMealFreq({
            breakfast: h.breakfastProvided ? days : 0,
            lunch: h.lunchProvided ? days : 0,
            dinner: h.dinnerProvided ? days : 0,
          });
        }
      } catch { setError('Failed to load'); }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  function toLocal(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const toISO = (v: string) => v ? new Date(v).toISOString() : '';

  function calcDuration() {
    if (!form.startDate || !form.endDate) return 1;
    return Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000));
  }

  async function handleSave() {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startDate: toISO(form.startDate), endDate: toISO(form.endDate),
          registrationDeadline: toISO(form.registrationDeadline),
          submissionDeadline: toISO(form.submissionDeadline),
          breakfastProvided: meals.breakfast, lunchProvided: meals.lunch,
          dinnerProvided: meals.dinner, swagProvided: meals.swag,
        }),
      });
      if (res.ok) setSuccess('Changes saved');
      else { const d = await res.json(); setError(d.error || 'Save failed'); }
    } catch { setError('Network error'); }
    setSaving(false);
    setTimeout(() => setSuccess(''), 3000);
  }

  async function handleStatusChange(newStatus: string) {
    const res = await fetch(`/api/hackathons/${hackathonId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      const messages: Record<string, string> = {
        REGISTRATION: 'Published! Registration is now open.',
        REGISTRATION_CLOSED: 'Registration closed.',
        ONGOING: 'Hackathon started!',
        ENDED: 'Hackathon ended.',
        CANCELLED: 'Hackathon cancelled.',
      };
      setSuccess(messages[newStatus] || `Status updated to ${newStatus}`);
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to update status');
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  const days = calcDuration();

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={sectionLabel}>Edit</p>
          <h1 style={pageTitle}>{form.title || 'Edit Hackathon'}</h1>
          <p className="org-text" style={{ marginTop: '0.3rem' }}>Update details and manage publication status.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="org-btn-secondary" onClick={() => router.push(`/organiser/command-center/${hackathonId}`)}>Command Center</button>
          <button className="org-btn-secondary" onClick={() => router.push(`/participant/hackathons/${hackathonId}`)}>Preview</button>
        </div>
      </div>

      {error && <div className="org-feedback org-feedback-error">{error}</div>}
      {success && <div className="org-feedback org-feedback-success">{success}</div>}

      {/* Status Controls */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Current Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span className={`org-badge ${
                status === 'ONGOING' ? 'org-badge-success' : 
                status === 'REGISTRATION' ? 'org-badge-accent' : 
                status === 'ENDED' || status === 'CANCELLED' ? 'org-badge-muted' :
                'org-badge-info'
              }`}>{status}</span>
              <span className="org-text" style={{ fontSize: '0.75rem' }}>
                {form.startDate ? `${days} day${days > 1 ? 's' : ''} event` : 'Set dates to calculate duration'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {status === 'DRAFT' && (
              <button className="org-btn-primary" onClick={() => handleStatusChange('REGISTRATION')}>
                Publish (Open Registration)
              </button>
            )}
            {status === 'REGISTRATION' && (
              <button className="org-btn-secondary" onClick={() => handleStatusChange('REGISTRATION_CLOSED')}>
                Close Registration
              </button>
            )}
            {(status === 'REGISTRATION' || status === 'REGISTRATION_CLOSED') && (
              <button className="org-btn-primary" onClick={() => handleStatusChange('ONGOING')}>
                Start Hackathon
              </button>
            )}
            {status === 'ONGOING' && (
              <button className="org-btn-secondary" onClick={() => handleStatusChange('ENDED')}>
                End Hackathon
              </button>
            )}
            {status !== 'CANCELLED' && status !== 'ENDED' && (
              <button className="org-btn-danger" onClick={() => {
                if (confirm('Are you sure you want to cancel this hackathon?')) {
                  handleStatusChange('CANCELLED');
                }
              }}>
                Cancel
              </button>
            )}
          </div>
        </div>
        
        {/* Status Flow Guide */}
        <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginTop: '0.5rem' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status Flow</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
            {['DRAFT', 'REGISTRATION', 'REGISTRATION_CLOSED', 'ONGOING', 'ENDED'].map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem',
                  background: status === s ? 'var(--accent)' : 'var(--bg-surface)',
                  color: status === s ? 'var(--text-inverse)' : 'var(--text-muted)',
                  fontWeight: status === s ? 600 : 400,
                  border: `1px solid ${status === s ? 'var(--accent)' : 'var(--border-subtle)'}`,
                }}>{s.replace('_', ' ')}</span>
                {i < 4 && <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        {/* Basics */}
        <p className="org-label" style={{ marginBottom: '0.75rem' }}>Basic Information</p>
        <div style={fieldGroup}>
          <div><label style={lbl}>Title</label><input className="org-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label style={lbl}>Tagline</label><input className="org-input" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
        </div>
        <div style={fieldGroup}>
          <div><label style={lbl}>Short Description</label><input className="org-input" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} /></div>
          <div><label style={lbl}>Banner URL</label><input className="org-input" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} /></div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}><label style={lbl}>Description</label><textarea className="org-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ minHeight: 80, resize: 'vertical' as const }} /></div>

        {/* Dates */}
        <p className="org-label" style={{ margin: '1rem 0 0.75rem' }}>Schedule</p>
        <div style={fieldGroup}>
          <div><label style={lbl}>Registration Deadline</label><input className="org-input" type="datetime-local" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} /></div>
          <div><label style={lbl}>Hackathon Start</label><input className="org-input" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><label style={lbl}>Hackathon End</label><input className="org-input" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          <div><label style={lbl}>Submission Deadline</label><input className="org-input" type="datetime-local" value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} /></div>
        </div>

        {/* Logistics */}
        <p className="org-label" style={{ margin: '1rem 0 0.75rem' }}>Logistics</p>
        <div style={fieldGroup}>
          <div>
            <label style={lbl}>Format</label>
            <select className="org-select" value={form.isVirtual ? 'virtual' : 'in-person'} onChange={(e) => setForm({ ...form, isVirtual: e.target.value === 'virtual' })}>
              <option value="virtual">Virtual</option><option value="in-person">In-Person</option>
            </select>
          </div>
          <div><label style={lbl}>Location</label><input className="org-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><label style={lbl}>Min Team Size</label><input className="org-input" type="number" min={1} value={form.minTeamSize} onChange={(e) => setForm({ ...form, minTeamSize: parseInt(e.target.value) || 1 })} /></div>
          <div><label style={lbl}>Max Team Size</label><input className="org-input" type="number" min={1} value={form.maxTeamSize} onChange={(e) => setForm({ ...form, maxTeamSize: parseInt(e.target.value) || 5 })} /></div>
        </div>

        {/* Meals with Frequency */}
        <p className="org-label" style={{ margin: '1rem 0 0.75rem' }}>Meals & Resources ({days} day{days > 1 ? 's' : ''} event)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
          {[
            { key: 'breakfast', label: 'Breakfast', color: '#f59e0b' },
            { key: 'lunch', label: 'Lunch', color: '#e8a44a' },
            { key: 'dinner', label: 'Dinner', color: '#818cf8' },
            { key: 'swag', label: 'Swag', color: '#3ecf8e' },
          ].map((m) => (
            <button key={m.key} type="button" onClick={() => {
              const next = !meals[m.key as keyof typeof meals];
              setMeals((p) => ({ ...p, [m.key]: next }));
              if (m.key !== 'swag') setMealFreq((p) => ({ ...p, [m.key]: next ? days : 0 }));
            }} style={{
              padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid',
              borderColor: meals[m.key as keyof typeof meals] ? `${m.color}50` : 'var(--border-default)',
              background: meals[m.key as keyof typeof meals] ? `${m.color}10` : 'var(--bg-raised)',
              color: meals[m.key as keyof typeof meals] ? m.color : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'center',
            }}>
              {meals[m.key as keyof typeof meals] ? '\u2713' : '\u2014'} {m.label}
            </button>
          ))}
        </div>

        {/* Meal Frequency */}
        {(meals.breakfast || meals.lunch || meals.dinner) && (
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>How many times will each meal be provided? (Based on {days} day{days > 1 ? 's' : ''})</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {[
                { key: 'breakfast', label: 'Breakfast', show: meals.breakfast, color: '#f59e0b' },
                { key: 'lunch', label: 'Lunch', show: meals.lunch, color: '#e8a44a' },
                { key: 'dinner', label: 'Dinner', show: meals.dinner, color: '#818cf8' },
              ].filter((m) => m.show).map((m) => (
                <div key={m.key}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{m.label}</label>
                  <input className="org-input" type="number" min={0} max={days * 3} value={mealFreq[m.key as keyof MealConfig]} onChange={(e) => setMealFreq((p) => ({ ...p, [m.key]: parseInt(e.target.value) || 0 }))} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              QR scanner will track up to {mealFreq.breakfast + mealFreq.lunch + mealFreq.dinner} meal redemptions per participant.
            </p>
          </div>
        )}

        {/* Host & Theme */}
        <p className="org-label" style={{ margin: '1rem 0 0.75rem' }}>Host & Theme</p>
        <div style={fieldGroup}>
          <div><label style={lbl}>Host / College</label><input className="org-input" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} /></div>
          <div><label style={lbl}>Contact Email</label><input className="org-input" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
          <div><label style={lbl}>Theme</label><input className="org-input" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} /></div>
          <div><label style={lbl}>Eligibility</label><input className="org-input" value={form.eligibilityDomain} onChange={(e) => setForm({ ...form, eligibilityDomain: e.target.value })} /></div>
        </div>
        <div style={{ marginBottom: '0.75rem' }}><label style={lbl}>Prize Pool</label><input className="org-input" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} /></div>
        <div><label style={lbl}>Rules</label><textarea className="org-input" value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} style={{ minHeight: 60, resize: 'vertical' as const }} /></div>

        <button className="org-btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', marginTop: '1.25rem', padding: '0.7rem' }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' };
const pageTitle: React.CSSProperties = { fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' };
const fieldGroup: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' };
