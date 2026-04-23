'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TimelineEntry { title: string; description: string; startTime: string; endTime: string; type: string }
interface SponsorEntry { name: string; logoUrl: string; tier: string; website: string }
interface PersonEntry { name: string; email: string; extra: string }

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'host', label: 'Host & Theme' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'people', label: 'People' },
  { id: 'review', label: 'Review' },
];

export default function HackathonForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '', tagline: '', description: '', shortDescription: '',
    bannerUrl: '', logoUrl: '',
    startDate: '', endDate: '', registrationDeadline: '', submissionDeadline: '',
    isVirtual: true, location: '',
    maxTeamSize: 5, minTeamSize: 1,
    breakfastProvided: false, lunchProvided: false, dinnerProvided: false, swagProvided: false,
    contactEmail: '', hostName: '', theme: '', eligibilityDomain: '',
    prize: '', rules: '',
  });

  const [timelines, setTimelines] = useState<TimelineEntry[]>([]);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [judges, setJudges] = useState<PersonEntry[]>([]);
  const [mentors, setMentors] = useState<PersonEntry[]>([]);

  const currentStep = STEPS[step];
  const toISO = (v: string) => v ? new Date(v).toISOString() : '';

  function canAdvance(): boolean {
    if (currentStep.id === 'basics') return !!form.title && !!form.description && !!form.shortDescription;
    if (currentStep.id === 'schedule') return !!form.startDate && !!form.endDate && !!form.registrationDeadline && !!form.submissionDeadline;
    if (currentStep.id === 'logistics') return form.minTeamSize > 0 && form.maxTeamSize >= form.minTeamSize;
    return true;
  }

  async function handleSubmit() {
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        startDate: toISO(form.startDate), endDate: toISO(form.endDate),
        registrationDeadline: toISO(form.registrationDeadline),
        submissionDeadline: toISO(form.submissionDeadline),
        sponsorDetails: sponsors.filter((s) => s.name),
        judgeDetails: judges.filter((j) => j.name).map((j) => ({ name: j.name, email: j.email, company: j.extra })),
        mentorDetails: mentors.filter((m) => m.name).map((m) => ({ name: m.name, email: m.email, expertise: m.extra })),
      };
      const res = await fetch('/api/hackathons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        // Create timelines if any
        if (timelines.length > 0) {
          for (const t of timelines) {
            if (t.title) {
              await fetch(`/api/hackathons/${data.data.id}/timelines`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...t, startTime: toISO(t.startTime), endTime: toISO(t.endTime) }),
              });
            }
          }
        }
        router.push(`/organiser/command-center/${data.data.id}`);
      } else {
        const d = await res.json();
        if (d.issues && Array.isArray(d.issues)) {
          const msgs = d.issues.map((iss: any) => `${iss.path.join('.')}: ${iss.message}`);
          setError(`Validation failed: ${msgs.join(', ')}`);
        } else {
          setError(d.error || 'Failed to create');
        }
      }
    } catch { setError('Network error'); }
    setLoading(false);
  }

  const up = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => setForm((p) => ({ ...p, [key]: val }));
  const inputStyle = { marginBottom: '0.75rem' };

  return (
    <div>
      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => i <= step && setStep(i)} style={{
            padding: '0.3rem 0.7rem', borderRadius: 999, border: '1px solid',
            borderColor: i === step ? 'var(--accent)' : i < step ? 'rgba(62,207,142,0.3)' : 'var(--border-default)',
            background: i === step ? 'var(--accent)' : i < step ? 'rgba(62,207,142,0.08)' : 'var(--bg-raised)',
            color: i === step ? 'var(--text-inverse)' : i < step ? '#3ecf8e' : 'var(--text-secondary)',
            fontFamily: 'var(--font-display)', fontSize: '0.65rem', cursor: i <= step ? 'pointer' : 'default',
            fontWeight: i === step ? 700 : 400,
          }}>{s.label}</button>
        ))}
      </div>

      {error && <div className="org-feedback org-feedback-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}

      {/* BASICS */}
      {currentStep.id === 'basics' && (
        <div>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Basic Information</p>
          <div style={inputStyle}><label style={lbl}>Title *</label><input className="org-input" value={form.title} onChange={(e) => up('title', e.target.value)} placeholder="Hackathon name" /></div>
          <div style={inputStyle}><label style={lbl}>Tagline</label><input className="org-input" value={form.tagline} onChange={(e) => up('tagline', e.target.value)} placeholder="A short catchy phrase" /></div>
          <div style={inputStyle}><label style={lbl}>Short Description *</label><input className="org-input" value={form.shortDescription} onChange={(e) => up('shortDescription', e.target.value)} placeholder="One-liner for cards" /></div>
          <div style={inputStyle}><label style={lbl}>Description *</label><textarea className="org-input" value={form.description} onChange={(e) => up('description', e.target.value)} style={{ minHeight: 100, resize: 'vertical' as const }} placeholder="Full event description" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={inputStyle}><label style={lbl}>Banner URL</label><input className="org-input" value={form.bannerUrl} onChange={(e) => up('bannerUrl', e.target.value)} placeholder="https://..." /></div>
            <div style={inputStyle}><label style={lbl}>Logo URL</label><input className="org-input" value={form.logoUrl} onChange={(e) => up('logoUrl', e.target.value)} placeholder="https://..." /></div>
          </div>
        </div>
      )}

      {/* SCHEDULE */}
      {currentStep.id === 'schedule' && (
        <div>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Schedule & Deadlines</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={inputStyle}><label style={lbl}>Registration Opens *</label><input className="org-input" type="datetime-local" value={form.registrationDeadline} onChange={(e) => up('registrationDeadline', e.target.value)} /></div>
            <div style={inputStyle}><label style={lbl}>Hackathon Start *</label><input className="org-input" type="datetime-local" value={form.startDate} onChange={(e) => up('startDate', e.target.value)} /></div>
            <div style={inputStyle}><label style={lbl}>Hackathon End *</label><input className="org-input" type="datetime-local" value={form.endDate} onChange={(e) => up('endDate', e.target.value)} /></div>
            <div style={inputStyle}><label style={lbl}>Submission Deadline *</label><input className="org-input" type="datetime-local" value={form.submissionDeadline} onChange={(e) => up('submissionDeadline', e.target.value)} /></div>
          </div>
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginTop: '0.5rem' }}>
            <p className="org-text" style={{ fontSize: '0.75rem' }}>Registration deadline is when sign-ups close. Submission deadline is when teams must submit their projects.</p>
          </div>
        </div>
      )}

      {/* LOGISTICS */}
      {currentStep.id === 'logistics' && (
        <div>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Logistics</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div style={inputStyle}>
              <label style={lbl}>Format</label>
              <select className="org-select" value={form.isVirtual ? 'virtual' : 'in-person'} onChange={(e) => up('isVirtual', e.target.value === 'virtual')}>
                <option value="virtual">Virtual</option><option value="in-person">In-Person</option>
              </select>
            </div>
            <div style={inputStyle}><label style={lbl}>Min Team Size</label><input className="org-input" type="number" min={1} value={form.minTeamSize} onChange={(e) => up('minTeamSize', parseInt(e.target.value) || 1)} /></div>
            <div style={inputStyle}><label style={lbl}>Max Team Size</label><input className="org-input" type="number" min={1} value={form.maxTeamSize} onChange={(e) => up('maxTeamSize', parseInt(e.target.value) || 5)} /></div>
          </div>
          {!form.isVirtual && <div style={inputStyle}><label style={lbl}>Location</label><input className="org-input" value={form.location} onChange={(e) => up('location', e.target.value)} placeholder="Venue name and address" /></div>}
          <div style={inputStyle}><label style={lbl}>Prize Pool</label><input className="org-input" value={form.prize} onChange={(e) => up('prize', e.target.value)} placeholder="e.g. $10,000" /></div>

          <p className="org-label" style={{ margin: '0.75rem 0 0.5rem' }}>Meals & Resources (for QR scanning)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[
              { key: 'breakfastProvided', label: 'Breakfast', color: '#f59e0b' },
              { key: 'lunchProvided', label: 'Lunch', color: '#e8a44a' },
              { key: 'dinnerProvided', label: 'Dinner', color: '#818cf8' },
              { key: 'swagProvided', label: 'Swag/T-shirts', color: '#3ecf8e' },
            ].map((m) => (
              <button key={m.key} type="button" onClick={() => up(m.key as any, !form[m.key as keyof typeof form])} style={{
                padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid',
                borderColor: form[m.key as keyof typeof form] ? `${m.color}50` : 'var(--border-default)',
                background: form[m.key as keyof typeof form] ? `${m.color}10` : 'var(--bg-raised)',
                color: form[m.key as keyof typeof form] ? m.color : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', cursor: 'pointer', textAlign: 'center',
              }}>
                {form[m.key as keyof typeof form] ? '\u2713' : '\u2014'} {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* HOST & THEME */}
      {currentStep.id === 'host' && (
        <div>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Host & Theme</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={inputStyle}><label style={lbl}>Host / College Name</label><input className="org-input" value={form.hostName} onChange={(e) => up('hostName', e.target.value)} placeholder="e.g. IIT Bombay" /></div>
            <div style={inputStyle}><label style={lbl}>Contact Email</label><input className="org-input" type="email" value={form.contactEmail} onChange={(e) => up('contactEmail', e.target.value)} placeholder="hackathon@college.edu" /></div>
            <div style={inputStyle}><label style={lbl}>Theme</label><input className="org-input" value={form.theme} onChange={(e) => up('theme', e.target.value)} placeholder="e.g. AI for Good, FinTech" /></div>
            <div style={inputStyle}><label style={lbl}>Eligibility Domain</label><input className="org-input" value={form.eligibilityDomain} onChange={(e) => up('eligibilityDomain', e.target.value)} placeholder="e.g. *.edu emails only" /></div>
          </div>
          <div style={inputStyle}><label style={lbl}>Rules & Guidelines</label><textarea className="org-input" value={form.rules} onChange={(e) => up('rules', e.target.value)} style={{ minHeight: 80, resize: 'vertical' as const }} placeholder="Hackathon rules and code of conduct" /></div>
        </div>
      )}

      {/* TIMELINE */}
      {currentStep.id === 'timeline' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p className="org-label">Event Timeline</p>
            <button className="org-btn-secondary" onClick={() => setTimelines((p) => [...p, { title: '', description: '', startTime: '', endTime: '', type: 'event' }])} style={{ fontSize: '0.65rem' }}>+ Add Event</button>
          </div>
          {timelines.length === 0 && <div className="org-empty" style={{ padding: '1.5rem' }}>No timeline events yet. Add keynotes, workshops, breaks, etc.</div>}
          {timelines.map((t, i) => (
            <div key={i} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="org-badge org-badge-muted">Event {i + 1}</span>
                <button onClick={() => setTimelines((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <input className="org-input" placeholder="Event title" value={t.title} onChange={(e) => setTimelines((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                <select className="org-select" value={t.type} onChange={(e) => setTimelines((p) => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
                  <option value="keynote">Keynote</option><option value="workshop">Workshop</option>
                  <option value="break">Break</option><option value="ceremony">Ceremony</option><option value="event">Other</option>
                </select>
                <input className="org-input" type="datetime-local" value={t.startTime} onChange={(e) => setTimelines((p) => p.map((x, j) => j === i ? { ...x, startTime: e.target.value } : x))} />
                <input className="org-input" type="datetime-local" value={t.endTime} onChange={(e) => setTimelines((p) => p.map((x, j) => j === i ? { ...x, endTime: e.target.value } : x))} />
              </div>
              <input className="org-input" placeholder="Description (optional)" value={t.description} onChange={(e) => setTimelines((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} style={{ marginTop: '0.5rem' }} />
            </div>
          ))}
        </div>
      )}

      {/* PEOPLE */}
      {currentStep.id === 'people' && (
        <div>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Sponsors, Judges & Mentors</p>
          <PersonSection title="Sponsors" items={sponsors} setItems={setSponsors} fields={[{ key: 'name', placeholder: 'Sponsor name' }, { key: 'tier', placeholder: 'Tier (gold/silver)' }, { key: 'website', placeholder: 'Website URL' }, { key: 'logoUrl', placeholder: 'Logo URL' }]} />
          <PersonSection title="Judges" items={judges} setItems={setJudges} fields={[{ key: 'name', placeholder: 'Judge name' }, { key: 'email', placeholder: 'Email' }, { key: 'extra', placeholder: 'Company / expertise' }]} />
          <PersonSection title="Mentors" items={mentors} setItems={setMentors} fields={[{ key: 'name', placeholder: 'Mentor name' }, { key: 'email', placeholder: 'Email' }, { key: 'extra', placeholder: 'Expertise' }]} />
        </div>
      )}

      {/* REVIEW */}
      {currentStep.id === 'review' && (
        <div>
          <p className="org-label" style={{ marginBottom: '0.75rem' }}>Review & Create</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[
              { l: 'Title', v: form.title },
              { l: 'Tagline', v: form.tagline || '—' },
              { l: 'Format', v: form.isVirtual ? 'Virtual' : `In-person: ${form.location || 'TBA'}` },
              { l: 'Team Size', v: `${form.minTeamSize}\u2013${form.maxTeamSize}` },
              { l: 'Hackathon', v: form.startDate ? `${new Date(form.startDate).toLocaleDateString()} \u2013 ${new Date(form.endDate).toLocaleDateString()}` : '—' },
              { l: 'Reg. Deadline', v: form.registrationDeadline ? new Date(form.registrationDeadline).toLocaleDateString() : '—' },
              { l: 'Submission', v: form.submissionDeadline ? new Date(form.submissionDeadline).toLocaleDateString() : '—' },
              { l: 'Host', v: form.hostName || '—' },
              { l: 'Theme', v: form.theme || '—' },
              { l: 'Meals', v: [form.breakfastProvided && 'Breakfast', form.lunchProvided && 'Lunch', form.dinnerProvided && 'Dinner', form.swagProvided && 'Swag'].filter(Boolean).join(', ') || 'None' },
              { l: 'Timeline', v: `${timelines.length} events` },
              { l: 'Sponsors', v: `${sponsors.filter((s) => s.name).length} added` },
              { l: 'Judges', v: `${judges.filter((j) => j.name).length} added` },
              { l: 'Mentors', v: `${mentors.filter((m) => m.name).length} added` },
            ].map((item) => (
              <div key={item.l} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem' }}>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.l}</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
        <button className="org-btn-secondary" onClick={() => step > 0 && setStep(step - 1)} style={{ opacity: step === 0 ? 0.3 : 1 }}>
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button className="org-btn-primary" onClick={() => canAdvance() && setStep(step + 1)} disabled={!canAdvance()}>
            Next
          </button>
        ) : (
          <button className="org-btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Hackathon'}
          </button>
        )}
      </div>
    </div>
  );
}

function PersonSection({ title, items, setItems, fields }: {
  title: string; items: any[]; setItems: (fn: any) => any;
  fields: Array<{ key: string; placeholder: string }>
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{title} ({items.length})</p>
        <button className="org-btn-secondary" onClick={() => setItems((p: any[]) => [...p, Object.fromEntries(fields.map((f) => [f.key, '']))])} style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}>+ Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: `repeat(${fields.length}, 1fr) auto`, gap: '0.4rem', marginBottom: '0.35rem', alignItems: 'center' }}>
          {fields.map((f) => (
            <input key={f.key} className="org-input" placeholder={f.placeholder} value={item[f.key]} onChange={(e) => setItems((p: any[]) => p.map((x: any, j: number) => j === i ? { ...x, [f.key]: e.target.value } : x))} style={{ fontSize: '0.78rem' }} />
          ))}
          <button onClick={() => setItems((p: any[]) => p.filter((_: any, j: number) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.8rem', cursor: 'pointer', padding: '0 0.25rem' }}>&times;</button>
        </div>
      ))}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' };
