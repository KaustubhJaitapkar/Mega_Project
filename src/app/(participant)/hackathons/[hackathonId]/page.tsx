'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Calendar, MapPin, Users, Trophy, Clock,
  FileText, Sparkles, CheckCircle2, ArrowRight, Share2, Heart, Bookmark
} from 'lucide-react';
import './hackathon-page.css';

interface Hackathon {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  shortDescription: string;
  bannerUrl?: string;
  logoUrl?: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  location?: string;
  isVirtual: boolean;
  prize?: string;
  rules?: string;
  maxTeamSize: number;
  minTeamSize: number;
  theme?: string;
  hostName?: string;
  contactEmail?: string;
  themedTracks?: string[];
  targetBatches?: string[];
  allowedDepartments?: string[];
  allowCrossYearTeams?: boolean;
  submissionRequirements?: string[];
  mealSchedule?: any[];
  rubricItems?: any[];
  sponsorDetails?: any[];
  judgeDetails?: any[];
  mentorDetails?: any[];
  breakfastProvided?: boolean;
  lunchProvided?: boolean;
  dinnerProvided?: boolean;
  swagProvided?: boolean;
  organiser: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  timelines: Array<{
    id: string;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
    type?: string;
  }>;
  _count?: {
    teams: number;
    submissions: number;
    attendances: number;
  };
}

const TRACK_ICONS: Record<string, string> = {
  'ai-ml': '🤖',
  'web3': '⛓️',
  'fintech': '💰',
  'healthtech': '🏥',
  'edtech': '📚',
  'cleantech': '🌱',
  'iot': '📡',
  'gaming': '🎮',
  'social': '🤝',
  'open': '🔓',
};

const TRACK_NAMES: Record<string, string> = {
  'ai-ml': 'AI/ML',
  'web3': 'Web3 & Blockchain',
  'fintech': 'FinTech',
  'healthtech': 'HealthTech',
  'edtech': 'EdTech',
  'cleantech': 'CleanTech',
  'iot': 'IoT & Hardware',
  'gaming': 'Gaming',
  'social': 'Social Impact',
  'open': 'Open Innovation',
};

const SUBMISSION_LABELS: Record<string, { label: string; icon: string }> = {
  'github': { label: 'GitHub Repository', icon: '🔗' },
  'demo': { label: 'Live Demo', icon: '🌐' },
  'video': { label: 'Video Pitch', icon: '🎬' },
  'presentation': { label: 'Presentation PDF', icon: '📄' },
  'readme': { label: 'README Docs', icon: '📝' },
  'demo-video': { label: 'Demo Video', icon: '🎥' },
};

/** Strip all data-* attributes from editor-generated HTML before rendering */
function cleanEditorHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/\s+data-[a-zA-Z0-9_-]+=(?:"[^"]*"|'[^']*'|\S+)/g, '')
    .replace(/\s+data-[a-zA-Z0-9_-]+(?=[\s/>])/g, '');
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDateTime(value: string) {
  return `${formatDate(value)} at ${formatTime(value)}`;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)' };
    case 'REGISTRATION': return { bg: 'rgba(16,185,129,0.15)', text: '#10b981', border: 'rgba(16,185,129,0.3)' };
    case 'ONGOING': return { bg: 'rgba(99,102,241,0.15)', text: '#6366f1', border: 'rgba(99,102,241,0.3)' };
    case 'ENDED': return { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)' };
    case 'CANCELLED': return { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.3)' };
    default: return { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)' };
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    'DRAFT': 'Draft',
    'REGISTRATION': 'Registration Open',
    'ONGOING': 'Happening Now',
    'ENDED': 'Ended',
    'CANCELLED': 'Cancelled',
  };
  return labels[status] || status;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'prizes', label: 'Prizes & Tracks' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'faq', label: 'FAQ' },
];

export default function HackathonDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const hackathonId = params.hackathonId as string;
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [isRegistered, setIsRegistered] = useState(false);
  const [unregistering, setUnregistering] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    async function fetchHackathon() {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}`);
        const data = await res.json();
        setHackathon(data.data);
        try {
          const regRes = await fetch(`/api/hackathons/${hackathonId}/register`);
          const regData = await regRes.json();
          setIsRegistered(!!regData?.data?.registered);
        } catch { /* silent */ }
      } catch (error) {
        console.error('Failed to fetch hackathon:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (hackathonId) fetchHackathon();
  }, [hackathonId]);

  const daysLeft = useMemo(() => {
    if (!hackathon) return 0;
    const end = new Date(hackathon.registrationDeadline).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [hackathon]);

  const isRegistrationOpen = hackathon?.status === 'REGISTRATION' && daysLeft > 0;

  async function unregisterFromHackathon() {
    if (!hackathon) return;
    setUnregistering(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/register`, { method: 'DELETE' });
      if (res.ok) {
        setIsRegistered(false);
        setHackathon((prev) =>
          prev ? {
            ...prev,
            _count: { ...prev._count, attendances: Math.max(0, (prev._count?.attendances || 0) - 1) },
          } : prev
        );
      } else {
        const d = await res.json();
        alert(d.error || 'Unregister failed');
      }
    } finally {
      setUnregistering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="hp-loading">
        <div className="hp-loading-spinner" />
        <p>Loading hackathon details...</p>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="hp-not-found">
        <div className="hp-not-found-icon">🔍</div>
        <h2>Hackathon not found</h2>
        <p>The hackathon you're looking for doesn't exist or has been removed.</p>
        <Link href="/participant/hackathons" className="hp-btn-primary">
          Browse Hackathons
        </Link>
      </div>
    );
  }

  const statusColor = getStatusColor(hackathon.status);
  const registeredCount = hackathon._count?.attendances ?? 0;

  return (
    <div className="hp-container">
      {/* Hero Section */}
      <section className="hp-hero">
        {hackathon.bannerUrl ? (
          <div className="hp-hero-banner">
            <img src={hackathon.bannerUrl} alt="" />
            <div className="hp-hero-overlay" />
          </div>
        ) : (
          <div className="hp-hero-gradient" />
        )}

        <div className="hp-hero-content">
          <div className="hp-hero-top">
            <div className="hp-hero-badges">
              <span className="hp-badge" style={{ background: statusColor.bg, color: statusColor.text, borderColor: statusColor.border }}>
                {getStatusLabel(hackathon.status)}
              </span>
              <span className="hp-badge hp-badge-dark">
                {hackathon.isVirtual ? '🌐 Online' : '📍 In-Person'}
              </span>
              {!hackathon.isVirtual && hackathon.location && (
                <span className="hp-badge hp-badge-dark">📍 {hackathon.location}</span>
              )}
            </div>
            <div className="hp-hero-actions">
              <button className="hp-icon-btn" onClick={() => setIsLiked(!isLiked)} title="Like">
                <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : 'currentColor'} />
              </button>
              <button className="hp-icon-btn" onClick={() => setIsSaved(!isSaved)} title="Save">
                <Bookmark size={20} fill={isSaved ? '#f59e0b' : 'none'} color={isSaved ? '#f59e0b' : 'currentColor'} />
              </button>
              <button className="hp-icon-btn" title="Share" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                <Share2 size={20} />
              </button>
            </div>
          </div>

          <div className="hp-hero-main">
            {hackathon.logoUrl && (
              <div className="hp-hero-logo">
                <img src={hackathon.logoUrl} alt={hackathon.title} />
              </div>
            )}
            <div className="hp-hero-info">
              <h1 className="hp-hero-title">{hackathon.title}</h1>
              {hackathon.tagline && <p className="hp-hero-tagline">{hackathon.tagline}</p>}
            </div>
          </div>

          <div className="hp-hero-meta">
            <div className="hp-meta-item">
              <Calendar size={18} />
              <div>
                <span className="hp-meta-label">Dates</span>
                <span className="hp-meta-value">{formatDate(hackathon.startDate)} — {formatDate(hackathon.endDate)}</span>
              </div>
            </div>
            <div className="hp-meta-item">
              <Users size={18} />
              <div>
                <span className="hp-meta-label">Team Size</span>
                <span className="hp-meta-value">{hackathon.minTeamSize} — {hackathon.maxTeamSize} members</span>
              </div>
            </div>
            {hackathon.prize && (
              <div className="hp-meta-item">
                <Trophy size={18} />
                <div>
                  <span className="hp-meta-label">Prize Pool</span>
                  <span className="hp-meta-value">{hackathon.prize}</span>
                </div>
              </div>
            )}
            {hackathon.hostName && (
              <div className="hp-meta-item">
                <Sparkles size={18} />
                <div>
                  <span className="hp-meta-label">Hosted by</span>
                  <span className="hp-meta-value">{hackathon.hostName}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Registration CTA Bar */}
      <section className="hp-cta-bar">
        <div className="hp-cta-inner">
          <div className="hp-cta-info">
            <div className="hp-cta-countdown">
              <Clock size={20} />
              <span>{isRegistrationOpen ? `${daysLeft} days left to register` : 'Registration closed'}</span>
            </div>
            <div className="hp-cta-registered">
              <Users size={16} />
              <span>{registeredCount} participants registered</span>
            </div>
          </div>
          <div className="hp-cta-buttons">
            {isRegistered ? (
              <>
                <Link href={`/participant/my-team?hackathonId=${hackathon.id}`} className="hp-btn-primary">
                  Go to My Team <ArrowRight size={16} />
                </Link>
                <button onClick={unregisterFromHackathon} className="hp-btn-secondary" disabled={unregistering}>
                  {unregistering ? 'Unregistering...' : 'Unregister'}
                </button>
              </>
            ) : (
              <Link
                href={isRegistrationOpen ? `/participant/hackathons/${hackathon.id}/register` : '#'}
                className={`hp-btn-primary ${!isRegistrationOpen ? 'hp-btn-disabled' : ''}`}
                onClick={(e) => !isRegistrationOpen && e.preventDefault()}
              >
                {isRegistrationOpen ? 'Register Now' : 'Registration Closed'} <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="hp-main">
        <div className="hp-content-grid">
          {/* Left Column - Tabs Content */}
          <div className="hp-content-left">
            <nav className="hp-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`hp-tab ${activeTab === tab.id ? 'hp-tab-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="hp-tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="hp-section">
                  <h2 className="hp-section-title">About This Hackathon</h2>
                  <div className="hp-description" dangerouslySetInnerHTML={{ __html: cleanEditorHtml(hackathon.description) }} />

                  {hackathon.theme && (
                    <div className="hp-info-card">
                      <h3 className="hp-info-title">Theme</h3>
                      <p className="hp-info-text">{hackathon.theme}</p>
                    </div>
                  )}

                  {hackathon.targetBatches && hackathon.targetBatches.length > 0 && (
                    <div className="hp-info-card">
                      <h3 className="hp-info-title">Eligibility</h3>
                      <div className="hp-tags">
                        {hackathon.targetBatches.map((batch) => (
                          <span key={batch} className="hp-tag">{batch}</span>
                        ))}
                      </div>
                      {hackathon.allowedDepartments && hackathon.allowedDepartments.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <p className="hp-info-label">Allowed Departments</p>
                          <div className="hp-tags">
                            {hackathon.allowedDepartments.map((dept) => (
                              <span key={dept} className="hp-tag hp-tag-muted">{dept}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {hackathon.allowCrossYearTeams && (
                        <p className="hp-info-note">✓ Cross-year teams allowed</p>
                      )}
                    </div>
                  )}

                  {/* Meals & Perks */}
                  {(hackathon.breakfastProvided || hackathon.lunchProvided || hackathon.dinnerProvided || hackathon.swagProvided) && (
                    <div className="hp-info-card">
                      <h3 className="hp-info-title">Perks & Amenities</h3>
                      <div className="hp-perks-grid">
                        {hackathon.breakfastProvided && (
                          <div className="hp-perk">
                            <span className="hp-perk-icon">🌅</span>
                            <span>Breakfast</span>
                          </div>
                        )}
                        {hackathon.lunchProvided && (
                          <div className="hp-perk">
                            <span className="hp-perk-icon">☀️</span>
                            <span>Lunch</span>
                          </div>
                        )}
                        {hackathon.dinnerProvided && (
                          <div className="hp-perk">
                            <span className="hp-perk-icon">🌙</span>
                            <span>Dinner</span>
                          </div>
                        )}
                        {hackathon.swagProvided && (
                          <div className="hp-perk">
                            <span className="hp-perk-icon">👕</span>
                            <span>Swag & T-shirts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rules */}
                  {hackathon.rules && (
                    <div className="hp-info-card">
                      <h3 className="hp-info-title">Rules & Guidelines</h3>
                      <div className="hp-rules" dangerouslySetInnerHTML={{ __html: cleanEditorHtml(hackathon.rules) }} />
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="hp-section">
                  <h2 className="hp-section-title">Event Timeline</h2>

                  {/* Key Dates */}
                  <div className="hp-dates-grid">
                    <div className="hp-date-card hp-date-card-blue">
                      <div className="hp-date-icon">
                        <Calendar size={24} />
                      </div>
                      <div className="hp-date-info">
                        <span className="hp-date-label">Registration Deadline</span>
                        <span className="hp-date-value">{formatDateTime(hackathon.registrationDeadline)}</span>
                      </div>
                    </div>
                    <div className="hp-date-card hp-date-card-green">
                      <div className="hp-date-icon">
                        <Sparkles size={24} />
                      </div>
                      <div className="hp-date-info">
                        <span className="hp-date-label">Hackathon Starts</span>
                        <span className="hp-date-value">{formatDateTime(hackathon.startDate)}</span>
                      </div>
                    </div>
                    <div className="hp-date-card hp-date-card-orange">
                      <div className="hp-date-icon">
                        <FileText size={24} />
                      </div>
                      <div className="hp-date-info">
                        <span className="hp-date-label">Submission Deadline</span>
                        <span className="hp-date-value">{formatDateTime(hackathon.submissionDeadline)}</span>
                      </div>
                    </div>
                    <div className="hp-date-card hp-date-card-purple">
                      <div className="hp-date-icon">
                        <Trophy size={24} />
                      </div>
                      <div className="hp-date-info">
                        <span className="hp-date-label">Hackathon Ends</span>
                        <span className="hp-date-value">{formatDateTime(hackathon.endDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Events */}
                  {hackathon.timelines && hackathon.timelines.length > 0 && (
                    <div className="hp-timeline">
                      <h3 className="hp-subsection-title">Scheduled Events</h3>
                      <div className="hp-timeline-list">
                        {hackathon.timelines.map((event, idx) => (
                          <div key={event.id} className="hp-timeline-item">
                            <div className="hp-timeline-dot" />
                            {idx < hackathon.timelines.length - 1 && <div className="hp-timeline-line" />}
                            <div className="hp-timeline-content">
                              <div className="hp-timeline-header">
                                <span className="hp-timeline-title">{event.title}</span>
                                {event.type && <span className="hp-timeline-type">{event.type}</span>}
                              </div>
                              <div className="hp-timeline-time">
                                {formatDateTime(event.startTime)} — {formatTime(event.endTime)}
                              </div>
                              {event.description && (
                                <p className="hp-timeline-desc">{event.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meal Schedule */}
                  {hackathon.mealSchedule && hackathon.mealSchedule.length > 0 && (
                    <div className="hp-meals">
                      <h3 className="hp-subsection-title">Meal Schedule</h3>
                      <div className="hp-meals-grid">
                        {hackathon.mealSchedule.map((meal: any) => (
                          <div key={meal.id} className="hp-meal-card">
                            <span className="hp-meal-icon">🍽️</span>
                            <div className="hp-meal-info">
                              <span className="hp-meal-name">{meal.name}</span>
                              <span className="hp-meal-time">Day {meal.day} • {meal.startTime} — {meal.endTime}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prizes & Tracks Tab */}
              {activeTab === 'prizes' && (
                <div className="hp-section">
                  <h2 className="hp-section-title">Prizes & Tracks</h2>

                  {/* Prize Pool */}
                  <div className="hp-prize-hero">
                    <div className="hp-prize-icon">🏆</div>
                    <div className="hp-prize-info">
                      <span className="hp-prize-label">Total Prize Pool</span>
                      <span className="hp-prize-value">{hackathon.prize || 'To be announced'}</span>
                    </div>
                  </div>

                  {/* Themed Tracks */}
                  {hackathon.themedTracks && hackathon.themedTracks.length > 0 && (
                    <div className="hp-tracks">
                      <h3 className="hp-subsection-title">Themed Tracks</h3>
                      <div className="hp-tracks-grid">
                        {hackathon.themedTracks.map((trackId) => (
                          <div key={trackId} className="hp-track-card">
                            <span className="hp-track-icon">{TRACK_ICONS[trackId] || '🎯'}</span>
                            <span className="hp-track-name">{TRACK_NAMES[trackId] || trackId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Judging Rubric */}
                  {hackathon.rubricItems && hackathon.rubricItems.length > 0 && (
                    <div className="hp-rubric">
                      <h3 className="hp-subsection-title">Judging Criteria</h3>
                      <div className="hp-rubric-list">
                        {hackathon.rubricItems.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="hp-rubric-item">
                            <div className="hp-rubric-header">
                              <span className="hp-rubric-name">{item.name}</span>
                              <span className="hp-rubric-weight">{item.weight}%</span>
                            </div>
                            {item.description && <p className="hp-rubric-desc">{item.description}</p>}
                            <div className="hp-rubric-bar">
                              <div className="hp-rubric-fill" style={{ width: `${item.weight}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sponsors */}
                  {hackathon.sponsorDetails && hackathon.sponsorDetails.length > 0 && (
                    <div className="hp-sponsors">
                      <h3 className="hp-subsection-title">Our Sponsors</h3>
                      <div className="hp-sponsors-grid">
                        {hackathon.sponsorDetails.map((sponsor: any, idx: number) => (
                          <div key={idx} className="hp-sponsor-card">
                            {sponsor.logoUrl && (
                              <img src={sponsor.logoUrl} alt={sponsor.name} className="hp-sponsor-logo" />
                            )}
                            <span className="hp-sponsor-name">{sponsor.name}</span>
                            {sponsor.tier && <span className="hp-sponsor-tier">{sponsor.tier}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Requirements Tab */}
              {activeTab === 'requirements' && (
                <div className="hp-section">
                  <h2 className="hp-section-title">Submission Requirements</h2>

                  {hackathon.submissionRequirements && hackathon.submissionRequirements.length > 0 ? (
                    <div className="hp-req-list">
                      {hackathon.submissionRequirements.map((reqId) => {
                        const req = SUBMISSION_LABELS[reqId] || { label: reqId, icon: '📋' };
                        return (
                          <div key={reqId} className="hp-req-item">
                            <span className="hp-req-icon">{req.icon}</span>
                            <span className="hp-req-label">{req.label}</span>
                            <CheckCircle2 size={20} className="hp-req-check" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="hp-empty-state">
                      <p>Submission requirements will be announced by the organizers.</p>
                    </div>
                  )}

                  {/* Judges */}
                  {hackathon.judgeDetails && hackathon.judgeDetails.length > 0 && (
                    <div className="hp-judges" style={{ marginTop: '2rem' }}>
                      <h3 className="hp-subsection-title">Judges</h3>
                      <div className="hp-people-grid">
                        {hackathon.judgeDetails.map((judge: any, idx: number) => (
                          <div key={idx} className="hp-person-card">
                            <div className="hp-person-avatar hp-person-avatar-blue">
                              {judge.name?.charAt(0) || '?'}
                            </div>
                            <div className="hp-person-info">
                              <span className="hp-person-name">{judge.name}</span>
                              {judge.company && <span className="hp-person-role">{judge.company}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mentors */}
                  {hackathon.mentorDetails && hackathon.mentorDetails.length > 0 && (
                    <div className="hp-mentors" style={{ marginTop: '2rem' }}>
                      <h3 className="hp-subsection-title">Mentors</h3>
                      <div className="hp-people-grid">
                        {hackathon.mentorDetails.map((mentor: any, idx: number) => (
                          <div key={idx} className="hp-person-card">
                            <div className="hp-person-avatar hp-person-avatar-green">
                              {mentor.name?.charAt(0) || '?'}
                            </div>
                            <div className="hp-person-info">
                              <span className="hp-person-name">{mentor.name}</span>
                              {mentor.expertise && <span className="hp-person-role">{mentor.expertise}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="hp-section">
                  <h2 className="hp-section-title">Frequently Asked Questions</h2>
                  <div className="hp-faq-list">
                    <div className="hp-faq-item">
                      <h4 className="hp-faq-q">Who can participate?</h4>
                      <p className="hp-faq-a">
                        {hackathon.targetBatches && hackathon.targetBatches.length > 0
                          ? `This hackathon is open to ${hackathon.targetBatches.join(', ')}.`
                          : 'This hackathon is open to all students.'}
                        {hackathon.allowedDepartments && hackathon.allowedDepartments.length > 0
                          ? ` Eligible departments: ${hackathon.allowedDepartments.join(', ')}.`
                          : ''}
                      </p>
                    </div>
                    <div className="hp-faq-item">
                      <h4 className="hp-faq-q">What is the team size?</h4>
                      <p className="hp-faq-a">Teams can have {hackathon.minTeamSize} to {hackathon.maxTeamSize} members.{hackathon.allowCrossYearTeams ? ' Cross-year teams are allowed.' : ''}</p>
                    </div>
                    <div className="hp-faq-item">
                      <h4 className="hp-faq-q">What should I submit?</h4>
                      <p className="hp-faq-a">
                        {hackathon.submissionRequirements && hackathon.submissionRequirements.length > 0
                          ? `You need to submit: ${hackathon.submissionRequirements.map(r => SUBMISSION_LABELS[r]?.label || r).join(', ')}.`
                          : 'Submission requirements will be announced before the event.'}
                      </p>
                    </div>
                    {hackathon.contactEmail && (
                      <div className="hp-faq-item">
                        <h4 className="hp-faq-q">How do I contact the organizers?</h4>
                        <p className="hp-faq-a">You can reach out at <a href={`mailto:${hackathon.contactEmail}`} className="hp-link">{hackathon.contactEmail}</a></p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hp-sidebar">
            {/* Register Card */}
            <div className="hp-sidebar-card hp-register-card">
              <div className="hp-register-header">
                <div className="hp-register-countdown">
                  <Clock size={18} />
                  <span>{daysLeft} days left</span>
                </div>
              </div>
              <div className="hp-register-body">
                {registeredCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 500 }}>{registeredCount} participants registered</span>
                  </div>
                )}
                {isRegistered ? (
                  <div className="hp-register-actions">
                    <Link href={`/participant/my-team?hackathonId=${hackathon.id}`} className="hp-btn-primary hp-btn-full">
                      Go to My Team <ArrowRight size={16} />
                    </Link>
                    <button onClick={unregisterFromHackathon} className="hp-btn-ghost hp-btn-full" disabled={unregistering}>
                      {unregistering ? 'Unregistering...' : 'Unregister'}
                    </button>
                  </div>
                ) : (
                  <Link
                    href={isRegistrationOpen ? `/participant/hackathons/${hackathon.id}/register` : '#'}
                    className={`hp-btn-primary hp-btn-full hp-btn-lg ${!isRegistrationOpen ? 'hp-btn-disabled' : ''}`}
                    onClick={(e) => !isRegistrationOpen && e.preventDefault()}
                  >
                    {isRegistrationOpen ? 'Register Now' : 'Registration Closed'}
                  </Link>
                )}
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="hp-sidebar-card">
              <h4 className="hp-sidebar-title">Quick Info</h4>
              <div className="hp-quick-info">
                <div className="hp-quick-item">
                  <Calendar size={16} />
                  <div>
                    <span className="hp-quick-label">Start Date</span>
                    <span className="hp-quick-value">{formatDate(hackathon.startDate)}</span>
                  </div>
                </div>
                <div className="hp-quick-item">
                  <Calendar size={16} />
                  <div>
                    <span className="hp-quick-label">End Date</span>
                    <span className="hp-quick-value">{formatDate(hackathon.endDate)}</span>
                  </div>
                </div>
                <div className="hp-quick-item">
                  <MapPin size={16} />
                  <div>
                    <span className="hp-quick-label">Location</span>
                    <span className="hp-quick-value">{hackathon.isVirtual ? 'Online' : hackathon.location || 'TBA'}</span>
                  </div>
                </div>
                <div className="hp-quick-item">
                  <Users size={16} />
                  <div>
                    <span className="hp-quick-label">Team Size</span>
                    <span className="hp-quick-value">{hackathon.minTeamSize} — {hackathon.maxTeamSize} members</span>
                  </div>
                </div>
                {hackathon.prize && (
                  <div className="hp-quick-item">
                    <Trophy size={16} />
                    <div>
                      <span className="hp-quick-label">Prize Pool</span>
                      <span className="hp-quick-value">{hackathon.prize}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Host Card */}
            {hackathon.organiser && (
              <div className="hp-sidebar-card">
                <h4 className="hp-sidebar-title">Organized by</h4>
                <div className="hp-host">
                  <div className="hp-host-avatar">
                    {hackathon.organiser.image ? (
                      <img src={hackathon.organiser.image} alt={hackathon.organiser.name} />
                    ) : (
                      hackathon.organiser.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="hp-host-info">
                    <span className="hp-host-name">{hackathon.organiser.name}</span>
                    {hackathon.hostName && <span className="hp-host-org">{hackathon.hostName}</span>}
                  </div>
                </div>
                {hackathon.contactEmail && (
                  <a href={`mailto:${hackathon.contactEmail}`} className="hp-btn-secondary hp-btn-full" style={{ marginTop: '1rem' }}>
                    Contact Organizer
                  </a>
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
