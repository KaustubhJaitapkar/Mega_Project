'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Bot, Link as LinkIcon, DollarSign, Activity, BookOpen, Leaf, Cpu, Gamepad2, Users, Globe,
  GitBranch, Layout, FileVideo, FileText, Code, Video,
  Info, Palette, Calendar, Target, Settings, Utensils, UploadCloud, Gavel, UsersRound, CheckCircle2,
  Sunrise, Sun, Moon, Shirt, Lightbulb,
  ChevronLeft, ChevronRight, Loader2, Trash2, Plus, CalendarClock,
  Heading2, Quote, LayoutList, PenLine, Building2, Mail,   Award, Users2, Scale, BriefcaseBusiness,
} from 'lucide-react';
import DatePicker from './ui/DatePicker';
import ImageUpload from './ui/ImageUpload';
import MealScheduleBuilder from './ui/MealScheduleBuilder';
import JudgingRubric from './ui/JudgingRubric';
import InternalMentorsList from './ui/InternalMentorsList';
import '@/app/form-components.css';

// Dynamic import for RichTextEditor to avoid SSR issues
const RichTextEditor = dynamic(() => import('./ui/RichTextEditor'), { ssr: false });

interface TimelineEntry {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: string;
}

interface SponsorEntry {
  name: string;
  logoUrl: string;
  tier: string;
  website: string;
}

interface PersonEntry {
  name: string;
  email: string;
  extra: string;
}

interface MealItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  day: number;
}

interface PrizeItem {
  id: string;
  title: string;
  amount: string;
}

interface RubricItem {
  id: string;
  name: string;
  description: string;
  maxScore: number;
}

interface MentorEntry {
  id: string;
  name: string;
  email: string;
  department: string;
  expertise: string;
}

const THEMED_TRACKS = [
  { id: 'ai-ml', label: 'AI/ML', icon: <Bot size={20} /> },
  { id: 'web3', label: 'Web3 & Blockchain', icon: <LinkIcon size={20} /> },
  { id: 'fintech', label: 'FinTech', icon: <DollarSign size={20} /> },
  { id: 'healthtech', label: 'HealthTech', icon: <Activity size={20} /> },
  { id: 'edtech', label: 'EdTech', icon: <BookOpen size={20} /> },
  { id: 'cleantech', label: 'CleanTech', icon: <Leaf size={20} /> },
  { id: 'iot', label: 'IoT & Hardware', icon: <Cpu size={20} /> },
  { id: 'gaming', label: 'Gaming & Entertainment', icon: <Gamepad2 size={20} /> },
  { id: 'social', label: 'Social Impact', icon: <Users size={20} /> },
  { id: 'open', label: 'Open Innovation', icon: <Globe size={20} /> },
];

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'AI & Data Science',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
  'Chemical',
  'Biotechnology',
  'Other',
];

const BATCHES = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year (PG)'];

const SUBMISSION_REQUIREMENTS = [
  { id: 'github', label: 'GitHub Repository', icon: <GitBranch size={20} /> },
  { id: 'demo', label: 'Live Demo Link', icon: <Layout size={20} /> },
  { id: 'video', label: 'Video Pitch', icon: <FileVideo size={20} /> },
  { id: 'presentation', label: 'Presentation PDF', icon: <FileText size={20} /> },
  { id: 'readme', label: 'README Documentation', icon: <Code size={20} /> },
  { id: 'demo-video', label: 'Demo Video (2-5 min)', icon: <Video size={20} /> },
];

function HfSectionHeader({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="hf-section-header">
      <span className="hf-section-header-icon">{icon}</span>
      <div className="hf-section-header-text">
        <h2 className="hf-section-title">{title}</h2>
        <p className="hf-section-desc">{desc}</p>
      </div>
    </div>
  );
}

const STEPS = [
  { id: 'basics', label: 'Basic Info', icon: <Info size={18} /> },
  { id: 'branding', label: 'Branding', icon: <Palette size={18} /> },
  { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} /> },
  { id: 'tracks', label: 'Tracks & Eligibility', icon: <Target size={18} /> },
  { id: 'logistics', label: 'Logistics', icon: <Settings size={18} /> },
  { id: 'meals', label: 'Meal Schedule', icon: <Utensils size={18} /> },
  { id: 'submissions', label: 'Submissions', icon: <UploadCloud size={18} /> },
  { id: 'judging', label: 'Judging', icon: <Gavel size={18} /> },
  { id: 'people', label: 'People', icon: <UsersRound size={18} /> },
  { id: 'review', label: 'Review', icon: <CheckCircle2 size={18} /> },
];

export default function HackathonForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Basic info
  const [form, setForm] = useState({
    title: '',
    tagline: '',
    description: '',
    shortDescription: '',
    bannerUrl: '',
    logoUrl: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    submissionDeadline: '',
    isVirtual: true,
    location: '',
    venue: '',
    maxTeamSize: 5,
    minTeamSize: 1,
    allowCrossYearTeams: false,
    breakfastProvided: false,
    lunchProvided: false,
    dinnerProvided: false,
    swagProvided: false,
    contactEmail: '',
    hostName: '',
    theme: '',
    eligibilityDomain: '',
    prize: '',
    rules: '',
  });

  // New fields
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [customTrack, setCustomTrack] = useState('');
  const [targetBatches, setTargetBatches] = useState<string[]>([]);
  const [allowedDepartments, setAllowedDepartments] = useState<string[]>([]);
  const [submissionRequirements, setSubmissionRequirements] = useState<string[]>([]);
  const [mealSchedule, setMealSchedule] = useState<MealItem[]>([]);
  const [rubricItems, setRubricItems] = useState<RubricItem[]>([]);
  const [internalMentors, setInternalMentors] = useState<MentorEntry[]>([]);
  const [prizeDetails, setPrizeDetails] = useState<PrizeItem[]>([]);

  // Existing states
  const [timelines, setTimelines] = useState<TimelineEntry[]>([]);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [judges, setJudges] = useState<PersonEntry[]>([]);

  const currentStep = STEPS[step];
  const toISO = (v: string) => (v ? new Date(v).toISOString() : '');

  // Calculate hackathon days for meal schedule
  const hackathonDays = form.startDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 2;

  // Step validation
  function canAdvance(): boolean {
    switch (currentStep.id) {
      case 'basics':
        return !!form.title && !!form.description && !!form.shortDescription;
      case 'branding':
        return true; // Optional step
      case 'schedule':
        return !!form.startDate && !!form.endDate && !!form.registrationDeadline && !!form.submissionDeadline;
      case 'tracks':
        return true; // Optional selections
      case 'logistics':
        return form.minTeamSize > 0 && form.maxTeamSize >= form.minTeamSize;
      case 'meals':
        return true; // Optional
      case 'submissions':
        return true; // Optional
      case 'judging':
        return true;
      case 'people':
        return true; // Optional
      default:
        return true;
    }
  }

  // Track selection toggle
  const toggleTrack = (trackId: string) => {
    setSelectedTracks(prev =>
      prev.includes(trackId)
        ? prev.filter(t => t !== trackId)
        : [...prev, trackId]
    );
  };

  // Add custom track
  const addCustomTrack = () => {
    if (customTrack.trim() && !selectedTracks.includes(customTrack.trim())) {
      setSelectedTracks(prev => [...prev, customTrack.trim()]);
      setCustomTrack('');
    }
  };

  // Remove custom track
  const removeTrack = (trackId: string) => {
    setSelectedTracks(prev => prev.filter(t => t !== trackId));
  };

  // Batch selection toggle
  const toggleBatch = (batch: string) => {
    setTargetBatches(prev =>
      prev.includes(batch)
        ? prev.filter(b => b !== batch)
        : [...prev, batch]
    );
  };

  // Department selection toggle
  const toggleDepartment = (dept: string) => {
    setAllowedDepartments(prev =>
      prev.includes(dept)
        ? prev.filter(d => d !== dept)
        : [...prev, dept]
    );
  };

  // Submission requirement toggle
  const toggleSubmissionReq = (reqId: string) => {
    setSubmissionRequirements(prev =>
      prev.includes(reqId)
        ? prev.filter(r => r !== reqId)
        : [...prev, reqId]
    );
  };

  const addPrize = () => {
    setPrizeDetails(prev => ([
      ...prev,
      { id: `prize-${Date.now()}`, title: '', amount: '' },
    ]));
  };

  const updatePrize = (id: string, field: 'title' | 'amount', value: string) => {
    setPrizeDetails(prev => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const removePrize = (id: string) => {
    setPrizeDetails(prev => prev.filter((p) => p.id !== id));
  };

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        startDate: toISO(form.startDate),
        endDate: toISO(form.endDate),
        registrationDeadline: toISO(form.registrationDeadline),
        submissionDeadline: toISO(form.submissionDeadline),
        themedTracks: selectedTracks,
        targetBatches,
        allowedDepartments,
        allowCrossYearTeams: form.allowCrossYearTeams,
        submissionRequirements,
        mealSchedule,
        prizeDetails: prizeDetails.filter((p) => p.title.trim()),
        rubricItems,
        internalMentors,
        sponsorDetails: sponsors.filter(s => s.name),
        judgeDetails: judges.filter(j => j.name).map(j => ({ name: j.name, email: j.email, company: j.extra })),
        mentorDetails: internalMentors.filter(m => m.name).map(m => ({
          name: m.name,
          email: m.email,
          department: m.department,
          expertise: m.expertise,
        })),
      };

      const res = await fetch('/api/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Create timelines if any
        if (timelines.length > 0) {
          for (const t of timelines) {
            if (t.title) {
              const timelineRes = await fetch(`/api/hackathons/${data.data.id}/timeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...t,
                  startTime: toISO(t.startTime),
                  endTime: toISO(t.endTime),
                }),
              });

              if (!timelineRes.ok) {
                const timelineData = await timelineRes.json().catch(() => null);
                throw new Error(timelineData?.error || 'Failed to create timeline event');
              }
            }
          }
        }
        // Create rubric if any
        if (rubricItems.length > 0) {
          const rubricRes = await fetch(`/api/hackathons/${data.data.id}/rubrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Default Rubric',
              description: 'Judging criteria for this hackathon',
              maxScore: 100,
              items: rubricItems.map(item => ({
                name: item.name,
                description: item.description,
                maxScore: item.maxScore,
              })),
            }),
          });

          if (!rubricRes.ok) {
            const rubricData = await rubricRes.json().catch(() => null);
            throw new Error(rubricData?.error || 'Failed to create rubric');
          }
        }
        router.push(`/organiser/command-center/${data.data.id}`);
      } else {
        const d = await res.json();
        if (d.issues && Array.isArray(d.issues)) {
          const msgs = d.issues.map((iss: any) => `${iss.path.join('.')}: ${iss.message}`);
          setError(`Validation failed: ${msgs.join(', ')}`);
        } else {
          setError(d.detail ? `${d.error}: ${d.detail}` : (d.error || 'Failed to create'));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
    setLoading(false);
  }

  const up = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="hf-container">
      {/* Step Indicator */}
      <div className="hf-steps">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`hf-step ${i === step ? 'hf-step-active' : ''} ${i < step ? 'hf-step-completed' : ''}`}
            onClick={() => i <= step && setStep(i)}
            disabled={i > step}
          >
            <span className="hf-step-icon">{s.icon}</span>
            <span className="hf-step-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="hf-progress">
        <div
          className="hf-progress-fill"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {error && (
        <div className="org-feedback org-feedback-error" style={{ marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* STEP: BASICS */}
      {currentStep.id === 'basics' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Info size={20} strokeWidth={1.75} />}
            title="Basic information"
            desc="Name your event, add a line people remember, then spell out what makes this hackathon worth their weekend."
          />

          <div className="hf-field">
            <label className="hf-label">
              <span className="hf-label-ic" aria-hidden>
                <Heading2 size={14} strokeWidth={2} />
              </span>
              <span>Hackathon title *</span>
            </label>
            <input
              className="org-input hf-input-lg"
              value={form.title}
              onChange={e => up('title', e.target.value)}
              placeholder="e.g. Winter Build Week — campus edition"
            />
          </div>

          <div className="hf-field">
            <label className="hf-label">
              <span className="hf-label-ic" aria-hidden>
                <Quote size={14} strokeWidth={2} />
              </span>
              <span>Tagline</span>
            </label>
            <input
              className="org-input"
              value={form.tagline}
              onChange={e => up('tagline', e.target.value)}
              placeholder="One honest sentence—what should teams feel when they read this?"
            />
          </div>

          <div className="hf-field">
            <label className="hf-label">
              <span className="hf-label-ic" aria-hidden>
                <LayoutList size={14} strokeWidth={2} />
              </span>
              <span>Short description *</span>
            </label>
            <input
              className="org-input"
              value={form.shortDescription}
              onChange={e => up('shortDescription', e.target.value)}
              placeholder="Shows on cards and listings—keep it concrete (who, format, vibe)."
            />
          </div>

          <div className="hf-field">
            <label className="hf-label">
              <span className="hf-label-ic" aria-hidden>
                <PenLine size={14} strokeWidth={2} />
              </span>
              <span>Full description / mission *</span>
            </label>
            <RichTextEditor
              value={form.description}
              onChange={val => up('description', val)}
              placeholder="Mission, schedule hints, who should join, what success looks like—write like you are inviting a friend."
              minHeight={250}
            />
          </div>
        </div>
      )}

      {/* STEP: BRANDING */}
      {currentStep.id === 'branding' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Palette size={20} strokeWidth={1.75} />}
            title="Brand assets"
            desc="Banner and logo show up everywhere participants look—square logo, wide banner works best."
          />

          <div className="hf-grid-2">
            <ImageUpload
              value={form.bannerUrl}
              onChange={val => up('bannerUrl', val)}
              label="Banner Image"
              type="banner"
            />
            <ImageUpload
              value={form.logoUrl}
              onChange={val => up('logoUrl', val)}
              label="Logo"
              type="logo"
            />
          </div>

          <div className="hf-branding-preview">
            <p className="hf-label" style={{ marginBottom: '0.5rem' }}>Preview</p>
            <div className="hf-preview-card">
              {form.bannerUrl && (
                <div className="hf-preview-banner">
                  <img src={form.bannerUrl} alt="Banner" />
                </div>
              )}
              <div className="hf-preview-body">
                {form.logoUrl && (
                  <div className="hf-preview-logo">
                    <img src={form.logoUrl} alt="Logo" />
                  </div>
                )}
                <div className="hf-preview-info">
                  <h3>{form.title || 'Your Hackathon'}</h3>
                  <p>{form.shortDescription || 'Your short description will appear here'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP: SCHEDULE */}
      {currentStep.id === 'schedule' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Calendar size={20} strokeWidth={1.75} />}
            title="Schedule & deadlines"
            desc="Lock the dates teams plan around. You can still tweak individual sessions in the timeline below."
          />

          <div className="hf-grid-2">
            <DatePicker
              value={form.registrationDeadline}
              onChange={val => up('registrationDeadline', val)}
              label="Registration Deadline *"
              placeholder="When does registration close?"
            />
            <DatePicker
              value={form.startDate}
              onChange={val => up('startDate', val)}
              label="Hackathon Start *"
              placeholder="When does the hackathon begin?"
            />
            <DatePicker
              value={form.endDate}
              onChange={val => up('endDate', val)}
              label="Hackathon End *"
              placeholder="When does the hackathon end?"
            />
            <DatePicker
              value={form.submissionDeadline}
              onChange={val => up('submissionDeadline', val)}
              label="Submission Deadline *"
              placeholder="When must projects be submitted?"
            />
          </div>

          <div className="hf-info-box">
            <span className="hf-info-icon"><Lightbulb size={20} /></span>
            <div>
              <strong>Registration Deadline</strong> - When team sign-ups close
              <br />
              <strong>Submission Deadline</strong> - When teams must submit their projects (usually before final presentations)
            </div>
          </div>

          {/* Timeline Events */}
          <div className="hf-subsection">
            <div className="hf-subsection-head">
              <p className="hf-subsection-title">
                <CalendarClock size={15} strokeWidth={2} aria-hidden />
                Event timeline
              </p>
              <button
                type="button"
                className="org-btn-secondary"
                onClick={() => setTimelines(p => [...p, { title: '', description: '', startTime: '', endTime: '', type: 'event' }])}
              >
                <span className="hf-btn-inner">
                  <Plus size={14} strokeWidth={2} aria-hidden />
                  Add block
                </span>
              </button>
            </div>
            {timelines.length === 0 && (
              <div className="org-empty" style={{ padding: '2rem 1.5rem' }}>
                Optional: drop in keynotes, mentor hours, meals, or quiet blocks so the run-of-show lives next to your dates.
              </div>
            )}
            {timelines.map((t, i) => (
              <div key={i} className="hf-timeline-card">
                <div className="hf-timeline-card-top">
                  <span className="org-badge org-badge-muted">Block {i + 1}</span>
                  <button
                    type="button"
                    className="hf-timeline-remove"
                    onClick={() => setTimelines(p => p.filter((_, j) => j !== i))}
                  >
                    <Trash2 size={14} strokeWidth={2} aria-hidden />
                    Remove
                  </button>
                </div>
                <div className="hf-timeline-grid">
                  <input
                    className="org-input"
                    placeholder="What is happening?"
                    value={t.title}
                    onChange={e => setTimelines(p => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  />
                  <select
                    className="org-select"
                    value={t.type}
                    onChange={e => setTimelines(p => p.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                  >
                    <option value="keynote">Keynote</option>
                    <option value="workshop">Workshop</option>
                    <option value="break">Break</option>
                    <option value="ceremony">Ceremony</option>
                    <option value="event">Other</option>
                  </select>
                  <DatePicker
                    value={t.startTime}
                    onChange={val => setTimelines(p => p.map((x, j) => j === i ? { ...x, startTime: val } : x))}
                    placeholder="Start"
                  />
                  <DatePicker
                    value={t.endTime}
                    onChange={val => setTimelines(p => p.map((x, j) => j === i ? { ...x, endTime: val } : x))}
                    placeholder="End"
                  />
                </div>
                <input
                  className="org-input hf-timeline-desc"
                  placeholder="Notes for volunteers or participants (optional)"
                  value={t.description}
                  onChange={e => setTimelines(p => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP: TRACKS & ELIGIBILITY */}
      {currentStep.id === 'tracks' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Target size={20} strokeWidth={1.75} />}
            title="Tracks & eligibility"
            desc="Optional guardrails: themed tracks help marketing; batches and departments keep registration fair."
          />

          {/* Themed Tracks */}
          <div className="hf-field">
            <label className="hf-label">Themed Track(s)</label>
            <p className="hf-field-hint">Select one or more tracks for your hackathon</p>
            <div className="hf-tracks-grid">
              {THEMED_TRACKS.map(track => (
                <button
                  key={track.id}
                  type="button"
                  className={`hf-track-card ${selectedTracks.includes(track.label) ? 'hf-track-card-active' : ''}`}
                  onClick={() => toggleTrack(track.label)}
                >
                  <span className="hf-track-icon">{track.icon}</span>
                  <span className="hf-track-label">{track.label}</span>
                </button>
              ))}
            </div>
            
            {/* Custom Track Input */}
            <div style={{ marginTop: '0.75rem' }}>
              <label className="hf-label">Add Custom Track</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="org-input"
                  value={customTrack}
                  onChange={e => setCustomTrack(e.target.value)}
                  placeholder="Enter custom track name (e.g., Healthcare Innovation)"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTrack(); } }}
                />
                <button type="button" className="org-btn-secondary" onClick={addCustomTrack} style={{ whiteSpace: 'nowrap' }}>
                  + Add
                </button>
              </div>
            </div>
            
            {/* Show selected custom tracks */}
            {selectedTracks.some(t => !THEMED_TRACKS.find(tt => tt.label === t)) && (
              <div style={{ marginTop: '0.75rem' }}>
                <label className="hf-label">Your Custom Tracks</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedTracks.filter(t => !THEMED_TRACKS.find(tt => tt.label === t)).map(track => (
                    <span key={track} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.4rem 0.75rem', borderRadius: '999px',
                      background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: '#8b5cf6', fontSize: '0.8rem',
                    }}>
                      {track}
                      <button type="button" onClick={() => removeTrack(track)} style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Target Batches */}
          <div className="hf-field">
            <label className="hf-label">Target Batches</label>
            <p className="hf-field-hint">Which year students can participate?</p>
            <div className="hf-checkbox-grid">
              {BATCHES.map(batch => (
                <label key={batch} className={`hf-checkbox ${targetBatches.includes(batch) ? 'hf-checkbox-active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={targetBatches.includes(batch)}
                    onChange={() => toggleBatch(batch)}
                  />
                  <span className="hf-checkbox-mark" />
                  <span className="hf-checkbox-label">{batch}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allowed Departments */}
          <div className="hf-field">
            <label className="hf-label">Allowed Departments</label>
            <p className="hf-field-hint">Leave empty to allow all departments</p>
            <div className="hf-checkbox-grid">
              {DEPARTMENTS.map(dept => (
                <label key={dept} className={`hf-checkbox ${allowedDepartments.includes(dept) ? 'hf-checkbox-active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={allowedDepartments.includes(dept)}
                    onChange={() => toggleDepartment(dept)}
                  />
                  <span className="hf-checkbox-mark" />
                  <span className="hf-checkbox-label">{dept}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP: LOGISTICS */}
      {currentStep.id === 'logistics' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Settings size={20} strokeWidth={1.75} />}
            title="Logistics"
            desc="How teams show up, how big they can be, and what you are providing on the ground (or in the Zoom)."
          />

          <div className="hf-grid-2">
            <div className="hf-field">
              <label className="hf-label">
                <span className="hf-label-ic" aria-hidden>
                  <Globe size={14} strokeWidth={2} />
                </span>
                <span>Format</span>
              </label>
              <select
                className="org-select"
                value={form.isVirtual ? 'virtual' : 'in-person'}
                onChange={e => up('isVirtual', e.target.value === 'virtual')}
              >
                <option value="virtual">Virtual</option>
                <option value="in-person">In-Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div className="hf-field">
              <label className="hf-label">
                <span className="hf-label-ic" aria-hidden>
                  <Award size={14} strokeWidth={2} />
                </span>
                <span>Prize pool</span>
              </label>
              <input
                className="org-input"
                value={form.prize}
                onChange={e => up('prize', e.target.value)}
                placeholder="Cash, credits, hardware, travel—whatever you are actually offering"
              />
            </div>
          </div>

          <div className="hf-card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h3 className="hf-card-title" style={{ marginBottom: 0 }}>Prize breakdown</h3>
              <button type="button" className="org-btn-secondary" onClick={addPrize}>+ Add Prize</button>
            </div>
            {prizeDetails.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Add entries like Winner — 5000.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {prizeDetails.map((prize) => (
                  <div key={prize.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      className="org-input"
                      placeholder="Prize title (e.g., Winner)"
                      value={prize.title}
                      onChange={(e) => updatePrize(prize.id, 'title', e.target.value)}
                    />
                    <input
                      className="org-input"
                      placeholder="Amount (e.g., 5000)"
                      value={prize.amount}
                      onChange={(e) => updatePrize(prize.id, 'amount', e.target.value)}
                    />
                    <button type="button" className="org-btn-ghost" onClick={() => removePrize(prize.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!form.isVirtual && (
            <>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Building2 size={14} strokeWidth={2} />
                  </span>
                  <span>Venue</span>
                </label>
                <input
                  className="org-input"
                  value={form.venue}
                  onChange={e => up('venue', e.target.value)}
                  placeholder="e.g., Main Auditorium, Tech Building"
                />
              </div>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Layout size={14} strokeWidth={2} />
                  </span>
                  <span>Location / address</span>
                </label>
                <input
                  className="org-input"
                  value={form.location}
                  onChange={e => up('location', e.target.value)}
                  placeholder="Full address with landmarks"
                />
              </div>
            </>
          )}

          {/* Team Composition */}
          <div className="hf-card">
            <h3 className="hf-card-title">Team composition</h3>
            <div className="hf-grid-3">
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Users2 size={14} strokeWidth={2} />
                  </span>
                  <span>Min team size</span>
                </label>
                <input
                  className="org-input"
                  type="number"
                  min={1}
                  value={form.minTeamSize}
                  onChange={e => up('minTeamSize', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Users2 size={14} strokeWidth={2} />
                  </span>
                  <span>Max team size</span>
                </label>
                <input
                  className="org-input"
                  type="number"
                  min={1}
                  value={form.maxTeamSize}
                  onChange={e => up('maxTeamSize', parseInt(e.target.value) || 5)}
                />
              </div>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <UsersRound size={14} strokeWidth={2} />
                  </span>
                  <span>Cross-year teams?</span>
                </label>
                <div style={{ paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    className={`org-toggle ${form.allowCrossYearTeams ? 'org-toggle--active' : ''}`}
                    onClick={() => up('allowCrossYearTeams', !form.allowCrossYearTeams)}
                  >
                    <div className="org-toggle-thumb" />
                  </button>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {form.allowCrossYearTeams ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Meals & Resources */}
          <div className="hf-field" style={{ marginTop: '1.25rem' }}>
            <label className="hf-label">
              <span className="hf-label-ic" aria-hidden>
                <Utensils size={14} strokeWidth={2} />
              </span>
              <span>Meals & resources (QR)</span>
            </label>
            <div className="hf-meals-grid">
              {[
                { key: 'breakfastProvided', label: 'Breakfast', icon: <Sunrise size={20} />, color: '#f59e0b' },
                { key: 'lunchProvided', label: 'Lunch', icon: <Sun size={20} />, color: '#e8a44a' },
                { key: 'dinnerProvided', label: 'Dinner', icon: <Moon size={20} />, color: '#818cf8' },
                { key: 'swagProvided', label: 'Swag/T-shirts', icon: <Shirt size={20} />, color: '#3ecf8e' },
              ].map(m => (
                <button
                  key={m.key}
                  type="button"
                  className={`hf-meal-toggle ${form[m.key as keyof typeof form] ? 'hf-meal-toggle-active' : ''}`}
                  onClick={() => up(m.key as any, !form[m.key as keyof typeof form])}
                  style={{ '--meal-color': m.color } as React.CSSProperties}
                >
                  <span className="hf-meal-icon">{m.icon}</span>
                  <span className="hf-meal-label">{m.label}</span>
                  <span className="hf-meal-status">
                    {form[m.key as keyof typeof form] ? '✓ Included' : '— Optional'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Host & Contact */}
          <div className="hf-card" style={{ marginTop: '1rem' }}>
            <h3 className="hf-card-title">Host & Contact</h3>
            <div className="hf-grid-2">
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Building2 size={14} strokeWidth={2} />
                  </span>
                  <span>Host / college name</span>
                </label>
                <input
                  className="org-input"
                  value={form.hostName}
                  onChange={e => up('hostName', e.target.value)}
                  placeholder="e.g., IIT Bombay"
                />
              </div>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Mail size={14} strokeWidth={2} />
                  </span>
                  <span>Contact email</span>
                </label>
                <input
                  className="org-input"
                  type="email"
                  value={form.contactEmail}
                  onChange={e => up('contactEmail', e.target.value)}
                  placeholder="hackathon@college.edu"
                />
              </div>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <Palette size={14} strokeWidth={2} />
                  </span>
                  <span>Theme</span>
                </label>
                <input
                  className="org-input"
                  value={form.theme}
                  onChange={e => up('theme', e.target.value)}
                  placeholder="e.g., AI for Good, FinTech"
                />
              </div>
              <div className="hf-field">
                <label className="hf-label">
                  <span className="hf-label-ic" aria-hidden>
                    <UsersRound size={14} strokeWidth={2} />
                  </span>
                  <span>Eligibility domain</span>
                </label>
                <input
                  className="org-input"
                  value={form.eligibilityDomain}
                  onChange={e => up('eligibilityDomain', e.target.value)}
                  placeholder="e.g., *.edu emails only"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP: MEALS */}
      {currentStep.id === 'meals' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Utensils size={20} strokeWidth={1.75} />}
            title="Meal schedule"
            desc="Each slot becomes a QR moment—handy when you are feeding hundreds and need a clear headcount."
          />

          <MealScheduleBuilder
            items={mealSchedule}
            onChange={setMealSchedule}
            hackathonDays={hackathonDays}
          />
        </div>
      )}

      {/* STEP: SUBMISSIONS */}
      {currentStep.id === 'submissions' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<UploadCloud size={20} strokeWidth={1.75} />}
            title="Submission requirements"
            desc="Be explicit now so nobody argues at the deadline. Teams see exactly this checklist."
          />

          <div className="hf-submissions-grid">
            {SUBMISSION_REQUIREMENTS.map(req => (
              <label
                key={req.id}
                className={`hf-submission-card ${submissionRequirements.includes(req.id) ? 'hf-submission-card-active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={submissionRequirements.includes(req.id)}
                  onChange={() => toggleSubmissionReq(req.id)}
                />
                <span className="hf-submission-icon">{req.icon}</span>
                <span className="hf-submission-label">{req.label}</span>
              </label>
            ))}
          </div>

          <div className="hf-field" style={{ marginTop: '1.75rem' }}>
            <label className="hf-label">
              <span className="hf-label-ic" aria-hidden>
                <FileText size={14} strokeWidth={2} />
              </span>
              <span>Rules & guidelines</span>
            </label>
            <RichTextEditor
              value={form.rules}
              onChange={val => up('rules', val)}
              placeholder="Add any specific rules, code of conduct, or submission guidelines..."
              minHeight={200}
            />
          </div>
        </div>
      )}

      {/* STEP: JUDGING */}
      {currentStep.id === 'judging' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<Gavel size={20} strokeWidth={1.75} />}
            title="Judging rubric"
            desc="Define the criteria and the maximum points for each one."
          />

          <JudgingRubric items={rubricItems} onChange={setRubricItems} />
        </div>
      )}

      {/* STEP: PEOPLE */}
      {currentStep.id === 'people' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<UsersRound size={20} strokeWidth={1.75} />}
            title="People"
            desc="Sponsors for the site, external judges for scoring, internal mentors for lab hours—you can grow this list later."
          />

          {/* Internal Mentors */}
          <div style={{ marginBottom: '2rem' }}>
            <InternalMentorsList
              mentors={internalMentors}
              onChange={setInternalMentors}
            />
          </div>

          {/* Sponsors */}
          <PersonSection
            title="Sponsors"
            titleIcon={<BriefcaseBusiness size={15} strokeWidth={2} />}
            items={sponsors}
            setItems={setSponsors}
            fields={[
              { key: 'name', placeholder: 'Sponsor name' },
              { key: 'tier', placeholder: 'Tier (Platinum/Gold/Silver)' },
              { key: 'website', placeholder: 'Website URL' },
              { key: 'logoUrl', placeholder: 'Logo URL' },
            ]}
          />

          {/* External Judges */}
          <PersonSection
            title="External judges"
            titleIcon={<Scale size={15} strokeWidth={2} />}
            items={judges}
            setItems={setJudges}
            fields={[
              { key: 'name', placeholder: 'Judge name' },
              { key: 'email', placeholder: 'Email' },
              { key: 'extra', placeholder: 'Company / Title' },
            ]}
          />
        </div>
      )}

      {/* STEP: REVIEW */}
      {currentStep.id === 'review' && (
        <div className="hf-section">
          <HfSectionHeader
            icon={<CheckCircle2 size={20} strokeWidth={1.75} />}
            title="Review & create"
            desc="Skim once more, then ship it. You will land in the command center right after creation."
          />

          <div className="hf-review-grid">
            {/* Basic Info */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">Basic Information</h4>
              <div className="hf-review-items">
                <ReviewItem label="Title" value={form.title} />
                <ReviewItem label="Tagline" value={form.tagline || '—'} />
                <ReviewItem label="Host" value={form.hostName || '—'} />
                <ReviewItem label="Theme" value={form.theme || '—'} />
              </div>
            </div>

            {/* Schedule */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">Schedule</h4>
              <div className="hf-review-items">
                <ReviewItem
                  label="Hackathon"
                  value={
                    form.startDate
                      ? `${new Date(form.startDate).toLocaleDateString()} — ${new Date(form.endDate).toLocaleDateString()}`
                      : '—'
                  }
                />
                <ReviewItem
                  label="Reg. Deadline"
                  value={form.registrationDeadline ? new Date(form.registrationDeadline).toLocaleDateString() : '—'}
                />
                <ReviewItem
                  label="Submission"
                  value={form.submissionDeadline ? new Date(form.submissionDeadline).toLocaleDateString() : '—'}
                />
                <ReviewItem label="Timeline" value={`${timelines.length} events`} />
              </div>
            </div>

            {/* Tracks & Eligibility */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">Tracks & Eligibility</h4>
              <div className="hf-review-items">
                <ReviewItem
                  label="Tracks"
                  value={selectedTracks.length > 0 ? selectedTracks.map(t => THEMED_TRACKS.find(tt => tt.id === t)?.label).join(', ') : 'None selected'}
                />
                <ReviewItem
                  label="Batches"
                  value={targetBatches.length > 0 ? targetBatches.join(', ') : 'All'}
                />
                <ReviewItem
                  label="Departments"
                  value={allowedDepartments.length > 0 ? allowedDepartments.join(', ') : 'All'}
                />
              </div>
            </div>

            {/* Logistics */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">Logistics</h4>
              <div className="hf-review-items">
                <ReviewItem label="Format" value={form.isVirtual ? 'Virtual' : `In-person: ${form.venue || form.location || 'TBA'}`} />
                <ReviewItem label="Team Size" value={`${form.minTeamSize}–${form.maxTeamSize}`} />
                <ReviewItem label="Cross-Year Teams" value={form.allowCrossYearTeams ? 'Yes' : 'No'} />
                <ReviewItem label="Prize Pool" value={form.prize || '—'} />
                <ReviewItem label="Prize Items" value={`${prizeDetails.filter((p) => p.title.trim()).length} listed`} />
                <ReviewItem
                  label="Meals"
                  value={[form.breakfastProvided && 'Breakfast', form.lunchProvided && 'Lunch', form.dinnerProvided && 'Dinner', form.swagProvided && 'Swag'].filter(Boolean).join(', ') || 'None'}
                />
                <ReviewItem label="Meal Slots" value={`${mealSchedule.length} configured`} />
              </div>
            </div>

            {/* Submissions */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">Submissions</h4>
              <div className="hf-review-items">
                <ReviewItem
                  label="Requirements"
                  value={submissionRequirements.length > 0 ? submissionRequirements.map(r => SUBMISSION_REQUIREMENTS.find(s => s.id === r)?.label).join(', ') : 'None specified'}
                />
              </div>
            </div>

            {/* Judging */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">Judging</h4>
              <div className="hf-review-items">
                <ReviewItem label="Criteria" value={`${rubricItems.length} defined`} />
                {rubricItems.length > 0 && (
                  <div className="hf-review-rubric">
                    {rubricItems.map(item => (
                      <div key={item.id} className="hf-review-rubric-item">
                        <span>{item.name || 'Unnamed'}</span>
                        <span className="hf-review-rubric-weight">{item.maxScore} pts max</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* People */}
            <div className="hf-review-card">
              <h4 className="hf-review-category">People</h4>
              <div className="hf-review-items">
                <ReviewItem label="Sponsors" value={`${sponsors.filter(s => s.name).length} added`} />
                <ReviewItem label="External Judges" value={`${judges.filter(j => j.name).length} added`} />
                <ReviewItem label="Internal Mentors" value={`${internalMentors.filter(m => m.name).length} assigned`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="hf-nav">
        <button
          type="button"
          className="org-btn-secondary"
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
        >
          <span className="hf-btn-inner">
            <ChevronLeft size={16} strokeWidth={2} aria-hidden />
            Back
          </span>
        </button>

        <div className="hf-nav-info">
          Step {step + 1} of {STEPS.length}
        </div>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="org-btn-primary"
            onClick={() => canAdvance() && setStep(step + 1)}
            disabled={!canAdvance()}
          >
            <span className="hf-btn-inner">
              Next: {STEPS[step + 1]?.label}
              <ChevronRight size={16} strokeWidth={2} aria-hidden />
            </span>
          </button>
        ) : (
          <button type="button" className="org-btn-primary" onClick={handleSubmit} disabled={loading}>
            <span className="hf-btn-inner">
              {loading ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="hf-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                <>
                  Create hackathon
                  <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
                </>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// Review Item Component
function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="hf-review-item">
      <span className="hf-review-label">{label}</span>
      <span className="hf-review-value">{value}</span>
    </div>
  );
}

// Person Section Component
function PersonSection({
  title,
  titleIcon,
  items,
  setItems,
  fields,
}: {
  title: string;
  titleIcon?: ReactNode;
  items: any[];
  setItems: (fn: any) => any;
  fields: Array<{ key: string; placeholder: string }>;
}) {
  const gridTemplate = `repeat(${fields.length}, minmax(0, 1fr)) auto`;
  return (
    <div className="hf-person-block">
      <div className="hf-person-head">
        <p className="hf-person-title">
          {titleIcon}
          <span>
            {title}
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.35rem' }}>({items.length})</span>
          </span>
        </p>
        <button
          type="button"
          className="org-btn-secondary"
          onClick={() => setItems((p: any[]) => [...p, Object.fromEntries(fields.map(f => [f.key, '']))])}
        >
          <span className="hf-btn-inner">
            <Plus size={14} strokeWidth={2} aria-hidden />
            Add row
          </span>
        </button>
      </div>
      <div className="hf-person-rows">
        {items.map((item, i) => (
          <div key={i} className="hf-person-row" style={{ gridTemplateColumns: gridTemplate }}>
            {fields.map(f => (
              <input
                key={f.key}
                className="org-input"
                placeholder={f.placeholder}
                value={item[f.key]}
                onChange={e =>
                  setItems((p: any[]) =>
                    p.map((x: any, j: number) => (j === i ? { ...x, [f.key]: e.target.value } : x))
                  )
                }
              />
            ))}
            <button
              type="button"
              className="hf-person-remove"
              onClick={() => setItems((p: any[]) => p.filter((_: any, j: number) => j !== i))}
              aria-label={`Remove ${title} row`}
            >
              <Trash2 size={16} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
