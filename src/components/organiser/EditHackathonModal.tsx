'use client';

import { useState, useEffect } from 'react';
import { X, Save, Image, Calendar, MapPin, Users, Award, FileText, Target } from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  shortDescription: string;
  bannerUrl?: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  isVirtual: boolean;
  location?: string;
  maxTeamSize: number;
  minTeamSize: number;
  prize?: string;
  rules?: string;
  hostName?: string;
  contactEmail?: string;
  theme?: string;
  eligibilityDomain?: string;
  status: string;
  breakfastProvided?: boolean;
  lunchProvided?: boolean;
  dinnerProvided?: boolean;
  swagProvided?: boolean;
  allowCrossYearTeams?: boolean;
  themedTracks?: string[];
  targetBatches?: string[];
  allowedDepartments?: string[];
}

interface EditHackathonModalProps {
  hackathon: Hackathon;
  onClose: () => void;
  onSave: (updated: Partial<Hackathon>) => void;
}

export default function EditHackathonModal({ hackathon, onClose, onSave }: EditHackathonModalProps) {
  const [form, setForm] = useState<Partial<Hackathon>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState<'basic' | 'schedule' | 'logistics' | 'tracks' | 'assets'>('basic');

  useEffect(() => {
    setForm({
      title: hackathon.title,
      tagline: hackathon.tagline || '',
      description: hackathon.description,
      shortDescription: hackathon.shortDescription,
      bannerUrl: hackathon.bannerUrl || '',
      logoUrl: hackathon.logoUrl || '',
      startDate: hackathon.startDate ? new Date(hackathon.startDate).toISOString().slice(0, 16) : '',
      endDate: hackathon.endDate ? new Date(hackathon.endDate).toISOString().slice(0, 16) : '',
      registrationDeadline: hackathon.registrationDeadline ? new Date(hackathon.registrationDeadline).toISOString().slice(0, 16) : '',
      submissionDeadline: hackathon.submissionDeadline ? new Date(hackathon.submissionDeadline).toISOString().slice(0, 16) : '',
      isVirtual: hackathon.isVirtual,
      location: hackathon.location || '',
      maxTeamSize: hackathon.maxTeamSize,
      minTeamSize: hackathon.minTeamSize,
      prize: hackathon.prize || '',
      rules: hackathon.rules || '',
      hostName: hackathon.hostName || '',
      contactEmail: hackathon.contactEmail || '',
      theme: hackathon.theme || '',
      eligibilityDomain: hackathon.eligibilityDomain || '',
      breakfastProvided: hackathon.breakfastProvided || false,
      lunchProvided: hackathon.lunchProvided || false,
      dinnerProvided: hackathon.dinnerProvided || false,
      swagProvided: hackathon.swagProvided || false,
      allowCrossYearTeams: hackathon.allowCrossYearTeams || false,
      themedTracks: hackathon.themedTracks || [],
      targetBatches: hackathon.targetBatches || [],
      allowedDepartments: hackathon.allowedDepartments || [],
    });
  }, [hackathon]);

  const update = (key: keyof Hackathon, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.title || form.title.length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }
    if (!form.description || form.description.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
          endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
          registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : undefined,
          submissionDeadline: form.submissionDeadline ? new Date(form.submissionDeadline).toISOString() : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data.data);
        onClose();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: <FileText size={14} /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={14} /> },
    { id: 'logistics', label: 'Logistics', icon: <Users size={14} /> },
    { id: 'tracks', label: 'Tracks & Eligibility', icon: <Target size={14} /> },
    { id: 'assets', label: 'Assets', icon: <Image size={14} /> },
  ];

  return (
    <div className="ehm-overlay" onClick={onClose}>
      <div className="ehm-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ehm-header">
          <div>
            <h2 className="ehm-title">Edit Hackathon</h2>
            <p className="ehm-subtitle">ID: {hackathon.id}</p>
          </div>
          <button className="ehm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className="ehm-tabs">
          {sections.map(s => (
            <button
              key={s.id}
              className={`ehm-tab ${activeSection === s.id ? 'ehm-tab-active' : ''}`}
              onClick={() => setActiveSection(s.id as any)}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="ehm-content">
          {error && <div className="ehm-error">{error}</div>}

          {/* Basic Info */}
          {activeSection === 'basic' && (
            <div className="ehm-section">
              <div className="ehm-field">
                <label className="ehm-label">Title *</label>
                <input
                  className="ehm-input"
                  value={form.title || ''}
                  onChange={e => update('title', e.target.value)}
                  placeholder="Hackathon name"
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Tagline</label>
                <input
                  className="ehm-input"
                  value={form.tagline || ''}
                  onChange={e => update('tagline', e.target.value)}
                  placeholder="A catchy one-liner"
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Short Description *</label>
                <input
                  className="ehm-input"
                  value={form.shortDescription || ''}
                  onChange={e => update('shortDescription', e.target.value)}
                  placeholder="Brief description for cards"
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Full Description *</label>
                <textarea
                  className="ehm-textarea"
                  value={form.description || ''}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Full hackathon description"
                  rows={6}
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Theme</label>
                <input
                  className="ehm-input"
                  value={form.theme || ''}
                  onChange={e => update('theme', e.target.value)}
                  placeholder="e.g., AI for Good, FinTech"
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Rules & Guidelines</label>
                <textarea
                  className="ehm-textarea"
                  value={form.rules || ''}
                  onChange={e => update('rules', e.target.value)}
                  placeholder="Hackathon rules and code of conduct"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Schedule */}
          {activeSection === 'schedule' && (
            <div className="ehm-section">
              <div className="ehm-field">
                <label className="ehm-label">Hackathon Start *</label>
                <input
                  className="ehm-input"
                  type="datetime-local"
                  value={form.startDate || ''}
                  onChange={e => update('startDate', e.target.value)}
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Hackathon End *</label>
                <input
                  className="ehm-input"
                  type="datetime-local"
                  value={form.endDate || ''}
                  onChange={e => update('endDate', e.target.value)}
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Registration Deadline *</label>
                <input
                  className="ehm-input"
                  type="datetime-local"
                  value={form.registrationDeadline || ''}
                  onChange={e => update('registrationDeadline', e.target.value)}
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Submission Deadline *</label>
                <input
                  className="ehm-input"
                  type="datetime-local"
                  value={form.submissionDeadline || ''}
                  onChange={e => update('submissionDeadline', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Logistics */}
          {activeSection === 'logistics' && (
            <div className="ehm-section">
              <div className="ehm-field">
                <label className="ehm-label">Format</label>
                <select
                  className="ehm-select"
                  value={form.isVirtual ? 'virtual' : 'in-person'}
                  onChange={e => update('isVirtual', e.target.value === 'virtual')}
                >
                  <option value="virtual">Virtual</option>
                  <option value="in-person">In-Person</option>
                </select>
              </div>
              {!form.isVirtual && (
                <>
                  <div className="ehm-field">
                    <label className="ehm-label">Venue / Location</label>
                    <input
                      className="ehm-input"
                      value={form.location || ''}
                      onChange={e => update('location', e.target.value)}
                      placeholder="e.g., Main Auditorium, IIT Bombay"
                    />
                  </div>
                </>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="ehm-field">
                  <label className="ehm-label">Min Team Size</label>
                  <input
                    className="ehm-input"
                    type="number"
                    min={1}
                    value={form.minTeamSize || 1}
                    onChange={e => update('minTeamSize', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="ehm-field">
                  <label className="ehm-label">Max Team Size</label>
                  <input
                    className="ehm-input"
                    type="number"
                    min={1}
                    value={form.maxTeamSize || 5}
                    onChange={e => update('maxTeamSize', parseInt(e.target.value) || 5)}
                  />
                </div>
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Prize Pool</label>
                <input
                  className="ehm-input"
                  value={form.prize || ''}
                  onChange={e => update('prize', e.target.value)}
                  placeholder="e.g., $10,000"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="ehm-field">
                  <label className="ehm-label">Host / College</label>
                  <input
                    className="ehm-input"
                    value={form.hostName || ''}
                    onChange={e => update('hostName', e.target.value)}
                    placeholder="e.g., IIT Bombay"
                  />
                </div>
                <div className="ehm-field">
                  <label className="ehm-label">Contact Email</label>
                  <input
                    className="ehm-input"
                    type="email"
                    value={form.contactEmail || ''}
                    onChange={e => update('contactEmail', e.target.value)}
                    placeholder="hackathon@college.edu"
                  />
                </div>
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Eligibility Domain</label>
                <input
                  className="ehm-input"
                  value={form.eligibilityDomain || ''}
                  onChange={e => update('eligibilityDomain', e.target.value)}
                  placeholder="e.g., *.edu emails only"
                />
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Meals & Perks</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { key: 'breakfastProvided', label: 'Breakfast' },
                    { key: 'lunchProvided', label: 'Lunch' },
                    { key: 'dinnerProvided', label: 'Dinner' },
                    { key: 'swagProvided', label: 'Swag/T-shirts' },
                  ].map(meal => (
                    <label key={meal.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: form[meal.key as keyof typeof form] ? 'rgba(16,185,129,0.1)' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: `1px solid ${form[meal.key as keyof typeof form] ? '#bbf7d0' : '#e2e8f0'}` }}>
                      <input
                        type="checkbox"
                        checked={!!form[meal.key as keyof typeof form]}
                        onChange={e => update(meal.key as any, e.target.checked)}
                      />
                      <span style={{ fontSize: 13, color: form[meal.key as keyof typeof form] ? '#166534' : '#64748b' }}>{meal.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="ehm-field">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!form.allowCrossYearTeams}
                    onChange={e => update('allowCrossYearTeams', e.target.checked)}
                  />
                  <span className="ehm-label" style={{ marginBottom: 0 }}>Allow cross-year teams</span>
                </label>
              </div>
            </div>
          )}

          {/* Tracks & Eligibility */}
          {activeSection === 'tracks' && (
            <div className="ehm-section">
              <div className="ehm-field">
                <label className="ehm-label">Themed Tracks</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['ai-ml', 'web3', 'fintech', 'healthtech', 'edtech', 'cleantech', 'iot', 'gaming', 'social', 'open'].map(trackId => {
                    const trackNames: Record<string, string> = { 'ai-ml': 'AI/ML', 'web3': 'Web3 & Blockchain', 'fintech': 'FinTech', 'healthtech': 'HealthTech', 'edtech': 'EdTech', 'cleantech': 'CleanTech', 'iot': 'IoT & Hardware', 'gaming': 'Gaming', 'social': 'Social Impact', 'open': 'Open Innovation' };
                    const isSelected = (form.themedTracks || []).includes(trackId);
                    return (
                      <label key={trackId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: isSelected ? 'rgba(99,102,241,0.1)' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: `1px solid ${isSelected ? '#c7d2fe' : '#e2e8f0'}` }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const current = form.themedTracks || [];
                            update('themedTracks', isSelected ? current.filter(t => t !== trackId) : [...current, trackId]);
                          }}
                        />
                        <span style={{ fontSize: 13, color: isSelected ? '#4338ca' : '#64748b' }}>{trackNames[trackId]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Target Batches</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year (PG)'].map(batch => {
                    const isSelected = (form.targetBatches || []).includes(batch);
                    return (
                      <label key={batch} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: isSelected ? 'rgba(16,185,129,0.1)' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: `1px solid ${isSelected ? '#bbf7d0' : '#e2e8f0'}` }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const current = form.targetBatches || [];
                            update('targetBatches', isSelected ? current.filter(b => b !== batch) : [...current, batch]);
                          }}
                        />
                        <span style={{ fontSize: 12, color: isSelected ? '#166534' : '#64748b' }}>{batch}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Allowed Departments</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['Computer Science', 'Information Technology', 'AI & Data Science', 'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Other'].map(dept => {
                    const isSelected = (form.allowedDepartments || []).includes(dept);
                    return (
                      <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: isSelected ? 'rgba(245,158,11,0.1)' : '#f8fafc', borderRadius: 8, cursor: 'pointer', border: `1px solid ${isSelected ? '#fde68a' : '#e2e8f0'}` }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const current = form.allowedDepartments || [];
                            update('allowedDepartments', isSelected ? current.filter(d => d !== dept) : [...current, dept]);
                          }}
                        />
                        <span style={{ fontSize: 12, color: isSelected ? '#92400e' : '#64748b' }}>{dept}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {activeSection === 'assets' && (
            <div className="ehm-section">
              <div className="ehm-field">
                <label className="ehm-label">Banner URL</label>
                <input
                  className="ehm-input"
                  value={form.bannerUrl || ''}
                  onChange={e => update('bannerUrl', e.target.value)}
                  placeholder="https://..."
                />
                {form.bannerUrl && (
                  <div className="ehm-preview">
                    <img src={form.bannerUrl} alt="Banner" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  </div>
                )}
              </div>
              <div className="ehm-field">
                <label className="ehm-label">Logo URL</label>
                <input
                  className="ehm-input"
                  value={form.logoUrl || ''}
                  onChange={e => update('logoUrl', e.target.value)}
                  placeholder="https://..."
                />
                {form.logoUrl && (
                  <div className="ehm-preview">
                    <img src={form.logoUrl} alt="Logo" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="ehm-footer">
          <button className="ehm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="ehm-btn-save" onClick={handleSave} disabled={loading}>
            <Save size={14} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
