'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PrizeItem { id: string; title: string; amount: string }
interface SponsorEntry { name: string; logoUrl: string; tier: string; website: string }
interface JudgeEntry { name: string; email: string; company: string }
interface MentorEntry { id: string; name: string; email: string; department: string; expertise: string }
interface RubricItem { id: string; name: string; description: string; maxScore: number }
interface MealItem { id: string; name: string; startTime: string; endTime: string; day: number }

const THEMED_TRACKS = [
  { id: 'ai-ml', label: 'AI/ML' },
  { id: 'web3', label: 'Web3 & Blockchain' },
  { id: 'fintech', label: 'FinTech' },
  { id: 'healthtech', label: 'HealthTech' },
  { id: 'edtech', label: 'EdTech' },
  { id: 'cleantech', label: 'CleanTech' },
  { id: 'iot', label: 'IoT & Hardware' },
  { id: 'gaming', label: 'Gaming & Entertainment' },
  { id: 'social', label: 'Social Impact' },
  { id: 'open', label: 'Open Innovation' },
];

const DEPARTMENTS = [
  'Computer Science', 'Information Technology', 'AI & Data Science',
  'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Other',
];

const BATCHES = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year (PG)'];

const SUBMISSION_REQUIREMENTS = [
  { id: 'github', label: 'GitHub Repository' },
  { id: 'demo', label: 'Live Demo Link' },
  { id: 'video', label: 'Video Pitch' },
  { id: 'presentation', label: 'Presentation PDF' },
  { id: 'readme', label: 'README Documentation' },
  { id: 'demo-video', label: 'Demo Video (2-5 min)' },
];

const TABS = ['basic', 'branding', 'schedule', 'tracks', 'logistics', 'meals', 'submissions', 'judging', 'people'] as const;
type TabId = typeof TABS[number];

export default function EditHackathonPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('basic');

  // Form state
  const [form, setForm] = useState({
    title: '', tagline: '', description: '', shortDescription: '',
    bannerUrl: '', logoUrl: '',
    startDate: '', endDate: '', registrationDeadline: '', submissionDeadline: '',
    isVirtual: true, location: '', venue: '',
    maxTeamSize: 5, minTeamSize: 1, allowCrossYearTeams: false,
    breakfastProvided: false, lunchProvided: false, dinnerProvided: false, swagProvided: false,
    contactEmail: '', hostName: '',     theme: '', eligibilityDomain: '',
    prize: '', rules: '',
  });

  const [status, setStatus] = useState('DRAFT');
  const [prizeDetails, setPrizeDetails] = useState<PrizeItem[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [customTrack, setCustomTrack] = useState('');
  const [targetBatches, setTargetBatches] = useState<string[]>([]);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [submissionRequirements, setSubmissionRequirements] = useState<string[]>([]);
  const [mealSchedule, setMealSchedule] = useState<MealItem[]>([]);
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([]);
  const [internalMentors, setInternalMentors] = useState<MentorEntry[]>([]);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [judges, setJudges] = useState<JudgeEntry[]>([]);

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
          isVirtual: h.isVirtual ?? true, location: h.location || '', venue: h.venue || '',
          maxTeamSize: h.maxTeamSize || 5, minTeamSize: h.minTeamSize || 1,
          allowCrossYearTeams: h.allowCrossYearTeams || false,
          breakfastProvided: h.breakfastProvided || false, lunchProvided: h.lunchProvided || false,
          dinnerProvided: h.dinnerProvided || false, swagProvided: h.swagProvided || false,
          contactEmail: h.contactEmail || '', hostName: h.hostName || '',
          theme: h.theme || '', eligibilityDomain: h.eligibilityDomain || '',
          prize: h.prize || '', rules: h.rules || '',
        });

        setPrizeDetails(Array.isArray(h.prizeDetails) ? h.prizeDetails : []);
        setSelectedTracks(Array.isArray(h.themedTracks) ? h.themedTracks : []);
        setTargetBatches(Array.isArray(h.targetBatches) ? h.targetBatches : []);
        setAllowedDepartments(Array.isArray(h.allowedDepartments) ? h.allowedDepartments : []);
        setSubmissionRequirements(Array.isArray(h.submissionRequirements) ? h.submissionRequirements : []);
        setMealSchedule(Array.isArray(h.mealSchedule) ? h.mealSchedule : []);
        setRubricItems(Array.isArray(h.rubricItems) ? h.rubricItems : []);
        setInternalMentors(Array.isArray(h.internalMentors) ? h.internalMentors : []);
        setSponsors(Array.isArray(h.sponsorDetails) ? h.sponsorDetails : []);
        setJudges(Array.isArray(h.judgeDetails) ? h.judgeDetails.map((j: any) => ({ name: j.name || '', email: j.email || '', company: j.company || j.extra || '' })) : []);
        setStatus(h.status || 'DRAFT');
      } catch { setError('Failed to load hackathon'); }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  function toLocal(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const toISO = (v: string) => v ? new Date(v).toISOString() : '';
  const up = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const addPrize = () => setPrizeDetails(p => [...p, { id: `prize-${Date.now()}`, title: '', amount: '' }]);
  const updatePrize = (id: string, field: 'title' | 'amount', value: string) => setPrizeDetails(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
  const removePrize = (id: string) => setPrizeDetails(p => p.filter(x => x.id !== id));

  const toggleTrack = (id: string) => setSelectedTracks(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]);
  
  const addCustomTrack = () => {
    if (customTrack.trim() && !selectedTracks.includes(customTrack.trim())) {
      setSelectedTracks(p => [...p, customTrack.trim()]);
      setCustomTrack('');
    }
  };
  
  const removeTrack = (id: string) => setSelectedTracks(p => p.filter(t => t !== id));
  
  const toggleBatch = (b: string) => setTargetBatches(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);
  const toggleDept = (d: string) => setAllowedDepartments(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);
  const toggleSubReq = (id: string) => setSubmissionRequirements(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const addMeal = () => setMealSchedule(p => [...p, { id: `meal-${Date.now()}`, name: '', startTime: '', endTime: '', day: 1 }]);
  const updateMeal = (id: string, field: string, value: string | number) => setMealSchedule(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
  const removeMeal = (id: string) => setMealSchedule(p => p.filter(x => x.id !== id));

  const addSponsor = () => setSponsors(p => [...p, { name: '', logoUrl: '', tier: '', website: '' }]);
  const updateSponsor = (i: number, field: string, value: string) => setSponsors(p => p.map((x, j) => j === i ? { ...x, [field]: value } : x));
  const removeSponsor = (i: number) => setSponsors(p => p.filter((_, j) => j !== i));

  const addJudge = () => setJudges(p => [...p, { name: '', email: '', company: '' }]);
  const updateJudge = (i: number, field: string, value: string) => setJudges(p => p.map((x, j) => j === i ? { ...x, [field]: value } : x));
  const removeJudge = (i: number) => setJudges(p => p.filter((_, j) => j !== i));

  const addMentor = () => setInternalMentors(p => [...p, { id: `mentor-${Date.now()}`, name: '', email: '', department: '', expertise: '' }]);
  const updateMentor = (id: string, field: string, value: string) => setInternalMentors(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
  const removeMentor = (id: string) => setInternalMentors(p => p.filter(x => x.id !== id));

  const addRubricItem = () => setRubricItems(p => [...p, { id: `rubric-${Date.now()}`, name: '', description: '', maxScore: 10 }]);
  const updateRubricItem = (id: string, field: string, value: string | number) => setRubricItems(p => p.map(x => x.id === id ? { ...x, [field]: value } : x));
  const removeRubricItem = (id: string) => setRubricItems(p => p.filter(x => x.id !== id));

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
          themedTracks: selectedTracks,
          targetBatches,
          allowedDepartments,
          submissionRequirements,
          mealSchedule,
          prizeDetails: prizeDetails.filter(p => p.title.trim()),
          rubricItems,
          internalMentors,
          sponsorDetails: sponsors.filter(s => s.name),
          judgeDetails: judges.filter(j => j.name).map(j => ({ name: j.name, email: j.email, company: j.company })),
        }),
      });
      if (res.ok) setSuccess('Changes saved successfully');
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
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  const tabIcons: Record<TabId, string> = {
    basic: '📝', branding: '🎨', schedule: '📅', tracks: '🎯',
    logistics: '⚙️', meals: '🍽️', submissions: '📤', judging: '⚖️', people: '👥',
  };

  const tabLabels: Record<TabId, string> = {
    basic: 'Basic Info', branding: 'Branding', schedule: 'Schedule', tracks: 'Tracks & Eligibility',
    logistics: 'Logistics', meals: 'Meal Schedule', submissions: 'Submissions', judging: 'Judging', people: 'People',
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Edit Hackathon</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{form.title || 'Edit Hackathon'}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="org-btn-secondary" onClick={() => router.push(`/organiser/command-center/${hackathonId}`)}>← Command Center</button>
          <button className="org-btn-secondary" onClick={() => router.push(`/participant/hackathons/${hackathonId}`)}>Preview</button>
        </div>
      </div>

      {error && <div className="org-feedback org-feedback-error" style={{ marginBottom: '0.75rem' }}>{error}</div>}
      {success && <div className="org-feedback org-feedback-success" style={{ marginBottom: '0.75rem' }}>{success}</div>}

      {/* Status Bar */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`org-badge ${status === 'ONGOING' ? 'org-badge-success' : status === 'REGISTRATION' ? 'org-badge-accent' : status === 'ENDED' || status === 'CANCELLED' ? 'org-badge-muted' : 'org-badge-info'}`}>{status}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {status === 'DRAFT' && <button className="org-btn-primary" onClick={() => handleStatusChange('REGISTRATION')}>Publish</button>}
            {status === 'REGISTRATION' && <button className="org-btn-secondary" onClick={() => handleStatusChange('REGISTRATION_CLOSED')}>Close Registration</button>}
            {(status === 'REGISTRATION' || status === 'REGISTRATION_CLOSED') && <button className="org-btn-primary" onClick={() => handleStatusChange('ONGOING')}>Start</button>}
            {status === 'ONGOING' && <button className="org-btn-secondary" onClick={() => handleStatusChange('ENDED')}>End</button>}
            {status !== 'CANCELLED' && status !== 'ENDED' && <button className="org-btn-danger" onClick={() => { if (confirm('Cancel this hackathon?')) handleStatusChange('CANCELLED'); }}>Cancel</button>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '1rem', background: 'var(--bg-surface)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
        {(TABS as string[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as TabId)}
            style={{
              padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: activeTab === tab ? 600 : 400,
              background: activeTab === tab ? 'var(--accent)' : 'transparent',
              color: activeTab === tab ? 'var(--text-inverse)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s',
            }}
          >
            <span>{tabIcons[tab as TabId]}</span>
            <span>{tabLabels[tab as TabId]}</span>
          </button>
        ))}
      </div>

      {/* Form Container */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        {/* BASIC INFO */}
        {activeTab === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>Title *</label><input className="org-input" value={form.title} onChange={e => up('title', e.target.value)} placeholder="Hackathon name" /></div>
              <div><label style={lbl}>Tagline</label><input className="org-input" value={form.tagline} onChange={e => up('tagline', e.target.value)} placeholder="One-liner" /></div>
            </div>
            <div><label style={lbl}>Short Description *</label><input className="org-input" value={form.shortDescription} onChange={e => up('shortDescription', e.target.value)} placeholder="Shows on cards and listings" /></div>
            <div><label style={lbl}>Full Description *</label><textarea className="org-input" value={form.description} onChange={e => up('description', e.target.value)} placeholder="Full hackathon description" style={{ minHeight: 150, resize: 'vertical' as const }} /></div>
            <div><label style={lbl}>Rules & Guidelines</label><textarea className="org-input" value={form.rules} onChange={e => up('rules', e.target.value)} placeholder="Rules, code of conduct, guidelines" style={{ minHeight: 100, resize: 'vertical' as const }} /></div>
          </div>
        )}

        {/* BRANDING */}
        {activeTab === 'branding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Branding</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>Banner URL</label><input className="org-input" value={form.bannerUrl} onChange={e => up('bannerUrl', e.target.value)} placeholder="https://..." />
                {form.bannerUrl && <img src={form.bannerUrl} alt="Banner" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />}
              </div>
              <div><label style={lbl}>Logo URL</label><input className="org-input" value={form.logoUrl} onChange={e => up('logoUrl', e.target.value)} placeholder="https://..." />
                {form.logoUrl && <img src={form.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }} />}
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Schedule & Deadlines</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>Registration Deadline *</label><input className="org-input" type="datetime-local" value={form.registrationDeadline} onChange={e => up('registrationDeadline', e.target.value)} /></div>
              <div><label style={lbl}>Hackathon Start *</label><input className="org-input" type="datetime-local" value={form.startDate} onChange={e => up('startDate', e.target.value)} /></div>
              <div><label style={lbl}>Hackathon End *</label><input className="org-input" type="datetime-local" value={form.endDate} onChange={e => up('endDate', e.target.value)} /></div>
              <div><label style={lbl}>Submission Deadline *</label><input className="org-input" type="datetime-local" value={form.submissionDeadline} onChange={e => up('submissionDeadline', e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* TRACKS & ELIGIBILITY */}
        {activeTab === 'tracks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Tracks & Eligibility</h3>
            
            <div>
              <label style={lbl}>Themed Tracks</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {THEMED_TRACKS.map(track => (
                  <button key={track.id} type="button" onClick={() => toggleTrack(track.id)} style={{
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${selectedTracks.includes(track.id) ? 'var(--accent)' : 'var(--border-subtle)'}`,
                    background: selectedTracks.includes(track.id) ? 'rgba(99,102,241,0.1)' : 'var(--bg-raised)',
                    color: selectedTracks.includes(track.id) ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.8rem', fontWeight: selectedTracks.includes(track.id) ? 600 : 400, textAlign: 'left',
                  }}>{track.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Target Batches</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {BATCHES.map(batch => (
                  <button key={batch} type="button" onClick={() => toggleBatch(batch)} style={{
                    padding: '0.4rem 0.75rem', borderRadius: '999px', cursor: 'pointer',
                    border: `1px solid ${targetBatches.includes(batch) ? '#10b981' : 'var(--border-subtle)'}`,
                    background: targetBatches.includes(batch) ? 'rgba(16,185,129,0.1)' : 'transparent',
                    color: targetBatches.includes(batch) ? '#10b981' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                  }}>{batch}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>Allowed Departments</label>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Leave empty to allow all departments</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                {DEPARTMENTS.map(dept => (
                  <button key={dept} type="button" onClick={() => toggleDept(dept)} style={{
                    padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${allowedDepartments.includes(dept) ? '#f59e0b' : 'var(--border-subtle)'}`,
                    background: allowedDepartments.includes(dept) ? 'rgba(245,158,11,0.1)' : 'transparent',
                    color: allowedDepartments.includes(dept) ? '#f59e0b' : 'var(--text-secondary)',
                    fontSize: '0.75rem', textAlign: 'left',
                  }}>{dept}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOGISTICS */}
        {activeTab === 'logistics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Logistics</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Format</label>
                <select className="org-select" value={form.isVirtual ? 'virtual' : 'in-person'} onChange={e => up('isVirtual', e.target.value === 'virtual')}>
                  <option value="virtual">Virtual</option>
                  <option value="in-person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div><label style={lbl}>Prize Pool</label><input className="org-input" value={form.prize} onChange={e => up('prize', e.target.value)} placeholder="e.g., $10,000" /></div>
            </div>

            {/* Prize Breakdown */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={lbl}>Prize Breakdown</label>
                <button className="org-btn-secondary" type="button" onClick={addPrize} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>+ Add Prize</button>
              </div>
              {prizeDetails.length === 0 ? (
                <div className="org-empty" style={{ padding: '0.75rem' }}>No prizes added yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {prizeDetails.map(prize => (
                    <div key={prize.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="org-input" placeholder="Prize title (e.g., Winner)" value={prize.title} onChange={e => updatePrize(prize.id, 'title', e.target.value)} />
                      <input className="org-input" placeholder="Amount" value={prize.amount} onChange={e => updatePrize(prize.id, 'amount', e.target.value)} />
                      <button className="org-btn-ghost" type="button" onClick={() => removePrize(prize.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!form.isVirtual && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><label style={lbl}>Venue</label><input className="org-input" value={form.venue} onChange={e => up('venue', e.target.value)} placeholder="e.g., Main Auditorium" /></div>
                <div><label style={lbl}>Location / Address</label><input className="org-input" value={form.location} onChange={e => up('location', e.target.value)} placeholder="Full address" /></div>
              </div>
            )}

            {/* Team Composition */}
            <div style={{ background: 'var(--bg-raised)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Team Composition</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div><label style={lbl}>Min Team Size</label><input className="org-input" type="number" min={1} value={form.minTeamSize} onChange={e => up('minTeamSize', parseInt(e.target.value) || 1)} /></div>
                <div><label style={lbl}>Max Team Size</label><input className="org-input" type="number" min={1} value={form.maxTeamSize} onChange={e => up('maxTeamSize', parseInt(e.target.value) || 5)} /></div>
                <div>
                  <label style={lbl}>Cross-Year Teams</label>
                  <button type="button" onClick={() => up('allowCrossYearTeams', !form.allowCrossYearTeams)} style={{
                    padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                    background: form.allowCrossYearTeams ? 'rgba(16,185,129,0.1)' : 'var(--bg-surface)',
                    color: form.allowCrossYearTeams ? '#10b981' : 'var(--text-secondary)', fontSize: '0.8rem',
                  }}>{form.allowCrossYearTeams ? '✓ Yes' : 'No'}</button>
                </div>
              </div>
            </div>

            {/* Meals */}
            <div>
              <label style={lbl}>Meals & Resources</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[
                  { key: 'breakfastProvided', label: 'Breakfast', color: '#f59e0b' },
                  { key: 'lunchProvided', label: 'Lunch', color: '#e8a44a' },
                  { key: 'dinnerProvided', label: 'Dinner', color: '#818cf8' },
                  { key: 'swagProvided', label: 'Swag/T-shirts', color: '#3ecf8e' },
                ].map(m => (
                  <button key={m.key} type="button" onClick={() => up(m.key, !form[m.key as keyof typeof form])} style={{
                    padding: '0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${form[m.key as keyof typeof form] ? `${m.color}50` : 'var(--border-subtle)'}`,
                    background: form[m.key as keyof typeof form] ? `${m.color}10` : 'var(--bg-raised)',
                    color: form[m.key as keyof typeof form] ? m.color : 'var(--text-secondary)',
                    fontSize: '0.75rem', textAlign: 'center',
                  }}>
                    {form[m.key as keyof typeof form] ? '✓ ' : '— '}{m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Host & Contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={lbl}>Host / College</label><input className="org-input" value={form.hostName} onChange={e => up('hostName', e.target.value)} placeholder="e.g., IIT Bombay" /></div>
              <div><label style={lbl}>Contact Email</label><input className="org-input" type="email" value={form.contactEmail} onChange={e => up('contactEmail', e.target.value)} placeholder="hackathon@college.edu" /></div>
              <div><label style={lbl}>Theme</label><input className="org-input" value={form.theme} onChange={e => up('theme', e.target.value)} placeholder="e.g., AI for Good" /></div>
              <div><label style={lbl}>Eligibility Domain</label><input className="org-input" value={form.eligibilityDomain} onChange={e => up('eligibilityDomain', e.target.value)} placeholder="e.g., *.edu emails only" /></div>
            </div>
          </div>
        )}

        {/* MEALS */}
        {activeTab === 'meals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Meal Schedule</h3>
              <button className="org-btn-secondary" type="button" onClick={addMeal} style={{ fontSize: '0.75rem' }}>+ Add Meal</button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Each slot becomes a QR scan moment for tracking meal redemptions.</p>
            {mealSchedule.length === 0 ? (
              <div className="org-empty" style={{ padding: '1.5rem' }}>No meal slots configured yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {mealSchedule.map((meal, i) => (
                  <div key={meal.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }}>
                    <input className="org-input" placeholder="Meal name" value={meal.name} onChange={e => updateMeal(meal.id, 'name', e.target.value)} />
                    <input className="org-input" type="datetime-local" value={meal.startTime} onChange={e => updateMeal(meal.id, 'startTime', e.target.value)} />
                    <input className="org-input" type="datetime-local" value={meal.endTime} onChange={e => updateMeal(meal.id, 'endTime', e.target.value)} />
                    <input className="org-input" type="number" min={1} placeholder="Day" value={meal.day} onChange={e => updateMeal(meal.id, 'day', parseInt(e.target.value) || 1)} />
                    <button className="org-btn-ghost" type="button" onClick={() => removeMeal(meal.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Submission Requirements</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
              {SUBMISSION_REQUIREMENTS.map(req => (
                <button key={req.id} type="button" onClick={() => toggleSubReq(req.id)} style={{
                  padding: '0.6rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  border: `1px solid ${submissionRequirements.includes(req.id) ? 'var(--accent)' : 'var(--border-subtle)'}`,
                  background: submissionRequirements.includes(req.id) ? 'rgba(99,102,241,0.1)' : 'var(--bg-raised)',
                  color: submissionRequirements.includes(req.id) ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: '0.78rem', textAlign: 'left',
                }}>{submissionRequirements.includes(req.id) ? '✓ ' : ''}{req.label}</button>
              ))}
            </div>
          </div>
        )}

        {/* JUDGING */}
        {activeTab === 'judging' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Judging Rubric</h3>
              <button className="org-btn-secondary" type="button" onClick={addRubricItem} style={{ fontSize: '0.75rem' }}>+ Add Criterion</button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Define criteria and max points for each.</p>
            {rubricItems.length === 0 ? (
              <div className="org-empty" style={{ padding: '1.5rem' }}>No rubric items defined yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rubricItems.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 0.5fr auto', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }}>
                    <input className="org-input" placeholder="Criterion name" value={item.name} onChange={e => updateRubricItem(item.id, 'name', e.target.value)} />
                    <input className="org-input" placeholder="Description" value={item.description} onChange={e => updateRubricItem(item.id, 'description', e.target.value)} />
                    <input className="org-input" type="number" min={1} max={100} placeholder="Max" value={item.maxScore} onChange={e => updateRubricItem(item.id, 'maxScore', parseInt(e.target.value) || 10)} />
                    <button className="org-btn-ghost" type="button" onClick={() => removeRubricItem(item.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PEOPLE */}
        {activeTab === 'people' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>People</h3>
            
            {/* Internal Mentors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={lbl}>Internal Mentors</label>
                <button className="org-btn-secondary" type="button" onClick={addMentor} style={{ fontSize: '0.75rem' }}>+ Add</button>
              </div>
              {internalMentors.length === 0 ? (
                <div className="org-empty" style={{ padding: '0.75rem' }}>No mentors added.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {internalMentors.map(m => (
                    <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="org-input" placeholder="Name" value={m.name} onChange={e => updateMentor(m.id, 'name', e.target.value)} />
                      <input className="org-input" placeholder="Email" value={m.email} onChange={e => updateMentor(m.id, 'email', e.target.value)} />
                      <input className="org-input" placeholder="Department" value={m.department} onChange={e => updateMentor(m.id, 'department', e.target.value)} />
                      <input className="org-input" placeholder="Expertise" value={m.expertise} onChange={e => updateMentor(m.id, 'expertise', e.target.value)} />
                      <button className="org-btn-ghost" type="button" onClick={() => removeMentor(m.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sponsors */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={lbl}>Sponsors</label>
                <button className="org-btn-secondary" type="button" onClick={addSponsor} style={{ fontSize: '0.75rem' }}>+ Add</button>
              </div>
              {sponsors.length === 0 ? (
                <div className="org-empty" style={{ padding: '0.75rem' }}>No sponsors added.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sponsors.map((s, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="org-input" placeholder="Name" value={s.name} onChange={e => updateSponsor(i, 'name', e.target.value)} />
                      <input className="org-input" placeholder="Tier" value={s.tier} onChange={e => updateSponsor(i, 'tier', e.target.value)} />
                      <input className="org-input" placeholder="Website" value={s.website} onChange={e => updateSponsor(i, 'website', e.target.value)} />
                      <input className="org-input" placeholder="Logo URL" value={s.logoUrl} onChange={e => updateSponsor(i, 'logoUrl', e.target.value)} />
                      <button className="org-btn-ghost" type="button" onClick={() => removeSponsor(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* External Judges */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={lbl}>External Judges</label>
                <button className="org-btn-secondary" type="button" onClick={addJudge} style={{ fontSize: '0.75rem' }}>+ Add</button>
              </div>
              {judges.length === 0 ? (
                <div className="org-empty" style={{ padding: '0.75rem' }}>No judges added.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {judges.map((j, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input className="org-input" placeholder="Name" value={j.name} onChange={e => updateJudge(i, 'name', e.target.value)} />
                      <input className="org-input" placeholder="Email" value={j.email} onChange={e => updateJudge(i, 'email', e.target.value)} />
                      <input className="org-input" placeholder="Company" value={j.company} onChange={e => updateJudge(i, 'company', e.target.value)} />
                      <button className="org-btn-ghost" type="button" onClick={() => removeJudge(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
        <button className="org-btn-secondary" onClick={() => router.push(`/organiser/command-center/${hackathonId}`)}>Cancel</button>
        <button className="org-btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 120 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 500 };
