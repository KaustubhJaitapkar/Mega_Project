'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Hackathon {
  id: string; title: string; tagline?: string; description: string; status: string;
  shortDescription?: string;
  bannerUrl?: string;
  logoUrl?: string;
  startDate: string; endDate: string; registrationDeadline: string; submissionDeadline: string;
  location?: string; isVirtual: boolean; prize?: string; rules?: string;
  maxTeamSize: number; minTeamSize: number; theme?: string; hostName?: string; eligibilityDomain?: string;
  breakfastProvided: boolean; lunchProvided: boolean; dinnerProvided: boolean; swagProvided: boolean;
  sponsorDetails?: any; judgeDetails?: any;
  organiser: { id: string; name: string; email: string };
  timelines: Array<{ id: string; title: string; description?: string | null; startTime: string; endTime: string; type: string }>;
  _count?: { teams: number; submissions: number; attendances: number };
}

const TABS = ['Overview', 'Timeline', 'Prizes', 'Rules'] as const;

function stripRichText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function HackathonDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [isRegistered, setIsRegistered] = useState(false);
  const [unregistering, setUnregistering] = useState(false);

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [hRes, rRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}/register`),
        ]);
        setHackathon((await hRes.json()).data);
        setIsRegistered(!!(await rRes.json())?.data?.registered);
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    })();
  }, [hackathonId]);

  async function unregister() {
    setUnregistering(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/register`, { method: 'DELETE' });
      if (res.ok) setIsRegistered(false);
    } finally { setUnregistering(false); }
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  if (!hackathon) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Hackathon not found.</div>;

  const daysLeft = Math.max(0, Math.ceil((new Date(hackathon.registrationDeadline).getTime() - Date.now()) / 86400000));
  const meals = [hackathon.breakfastProvided && 'Breakfast', hackathon.lunchProvided && 'Lunch', hackathon.dinnerProvided && 'Dinner', hackathon.swagProvided && 'Swag'].filter(Boolean).join(' \u00b7 ') || 'TBA';
  const sponsors = hackathon.sponsorDetails || [];
  const cleanedDescription = stripRichText(hackathon.shortDescription || hackathon.description);
  const rulesLines = (hackathon.rules || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: '2rem', marginBottom: '1.25rem',
        position: 'relative', overflow: 'hidden',
      }}>
        {hackathon.bannerUrl && (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
            <img src={hackathon.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 0% 100%, var(--accent-dim), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <span className={`org-badge ${
              hackathon.status === 'ONGOING' ? 'org-badge-success' : 
              hackathon.status === 'REGISTRATION' ? 'org-badge-accent' : 
              hackathon.status === 'DRAFT' ? 'org-badge-warning' :
              hackathon.status === 'ENDED' || hackathon.status === 'CANCELLED' ? 'org-badge-muted' :
              'org-badge-info'
            }`}>
              {hackathon.status === 'DRAFT' ? 'COMING SOON' : hackathon.status}
            </span>
            {hackathon.theme && <span className="org-badge org-badge-info">{hackathon.theme}</span>}
            <span className="org-badge org-badge-muted">{hackathon.isVirtual ? 'Virtual' : hackathon.location || 'In-person'}</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: '0.35rem' }}>
            {hackathon.title}
          </h1>
          {hackathon.logoUrl && (
            <div style={{ width: 64, height: 64, marginBottom: '0.6rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-default)', background: 'var(--bg-raised)' }}>
              <img src={hackathon.logoUrl} alt={`${hackathon.title} logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {hackathon.tagline && <p style={{ fontSize: '1rem', color: 'var(--accent)', marginBottom: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{hackathon.tagline}</p>}
          <p className="org-text" style={{ maxWidth: 600, marginBottom: '1rem' }}>{cleanedDescription}</p>

          {/* Quick Stats */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Date', value: `${new Date(hackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} \u2013 ${new Date(hackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` },
              { label: 'Team Size', value: `${hackathon.minTeamSize}\u2013${hackathon.maxTeamSize}` },
              { label: 'Prize', value: hackathon.prize || 'TBD' },
              { label: 'Host', value: hackathon.hostName || hackathon.organiser?.name || 'TBA' },
              { label: 'Meals', value: meals },
            ].map((s) => (
              <div key={s.label}>
                <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>{s.label}</p>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1rem' }}>
        {/* Left: Tabs */}
        <div>
          {/* Tab Bar */}
          <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.6rem', marginBottom: '1rem' }}>
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '0.3rem 0.7rem', borderRadius: 999, border: '1px solid',
                borderColor: activeTab === tab ? 'var(--accent)' : 'var(--border-default)',
                background: activeTab === tab ? 'var(--accent)' : 'var(--bg-raised)',
                color: activeTab === tab ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontSize: '0.65rem', cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 400,
              }}>{tab}</button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Sponsors */}
              {sponsors.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <p className="org-label" style={{ marginBottom: '0.75rem' }}>Sponsors</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {sponsors.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                        {s.logoUrl && <img src={s.logoUrl} alt={s.name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} />}
                        <div>
                          <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</p>
                          {s.tier && <span className="org-badge org-badge-muted" style={{ fontSize: '0.5rem' }}>{s.tier}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                {[
                  { label: 'Teams Registered', value: hackathon._count?.teams || 0, color: '#818cf8' },
                  { label: 'Submissions', value: hackathon._count?.submissions || 0, color: '#3ecf8e' },
                  { label: 'Checked In', value: hackathon._count?.attendances || 0, color: 'var(--accent)' },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${s.color}`, borderRadius: 'var(--radius-lg)', padding: '0.85rem' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{s.label}</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Timeline' && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              {(hackathon.timelines || []).length === 0 ? (
                <p className="org-text">Timeline will be announced soon.</p>
              ) : hackathon.timelines.map((ev) => (
                <div key={ev.id} style={{
                  display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{new Date(ev.startTime).getDate()}</p>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{new Date(ev.startTime).toLocaleString('default', { month: 'short' })}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{ev.title}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} \u2013 {new Date(ev.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {ev.description && <p className="org-text" style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>{ev.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Prizes' && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <p className="org-label">Total Prize Pool</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>{hackathon.prize || 'TBD'}</p>
                </div>
                <span className="org-badge org-badge-success">Certificate</span>
              </div>
              <p className="org-text">All qualifying teams receive digital certificates.</p>
            </div>
          )}

          {activeTab === 'Rules' && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <p className="org-label" style={{ marginBottom: '0.75rem' }}>Rules & Guidelines</p>
              {rulesLines.length > 0 ? rulesLines.map((line, i) => (
                <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '0.4rem' }}>{line}</p>
              )) : <p className="org-text">Rules will be shared by the organisers soon.</p>}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Registration Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            {hackathon.status === 'DRAFT' ? (
              <div style={{ textAlign: 'center' }}>
                <span className="org-badge org-badge-warning" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>Preview Mode</span>
                <p className="org-text" style={{ fontSize: '0.82rem', marginBottom: '0.75rem' }}>Registration not yet open</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Check back when the hackathon is published</p>
              </div>
            ) : hackathon.status === 'CANCELLED' ? (
              <div style={{ textAlign: 'center' }}>
                <span className="org-badge org-badge-muted" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>Cancelled</span>
                <p className="org-text" style={{ fontSize: '0.82rem' }}>This hackathon has been cancelled</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className={`org-badge ${
                    hackathon.status === 'ONGOING' ? 'org-badge-success' :
                    hackathon.status === 'REGISTRATION' ? 'org-badge-accent' :
                    'org-badge-muted'
                  }`}>
                    {hackathon.status === 'REGISTRATION' ? `${daysLeft} Days Left` : hackathon.status}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hackathon._count?.teams || 0} teams</span>
                </div>

                {isRegistered ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <Link href={`/participant/my-team?hackathonId=${hackathon.id}`} className="org-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>My Team</Link>
                    {hackathon.status === 'REGISTRATION' && (
                      <Link href={`/participant/hackathons/${hackathon.id}/register`} className="org-btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>Update Registration</Link>
                    )}
                    {hackathon.status === 'REGISTRATION' && (
                      <button onClick={unregister} className="org-btn-danger" style={{ width: '100%', justifyContent: 'center' }} disabled={unregistering}>
                        {unregistering ? '...' : 'Unregister'}
                      </button>
                    )}
                  </div>
                ) : hackathon.status === 'REGISTRATION' ? (
                  <Link href={`/participant/hackathons/${hackathon.id}/register`} className="org-btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                    Register Now
                  </Link>
                ) : hackathon.status === 'ONGOING' ? (
                  <p className="org-text" style={{ textAlign: 'center', fontSize: '0.82rem' }}>Registration is closed</p>
                ) : hackathon.status === 'ENDED' ? (
                  <p className="org-text" style={{ textAlign: 'center', fontSize: '0.82rem' }}>This hackathon has ended</p>
                ) : null}
              </>
            )}
          </div>

          {/* Key Dates */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p className="org-label" style={{ marginBottom: '0.6rem' }}>Key Dates</p>
            {[
              { label: 'Registration Closes', date: hackathon.registrationDeadline },
              { label: 'Event Starts', date: hackathon.startDate },
              { label: 'Submission Deadline', date: hackathon.submissionDeadline },
              { label: 'Event Ends', date: hackathon.endDate },
            ].map((d) => (
              <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>

          {/* Eligibility */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
            <p className="org-label" style={{ marginBottom: '0.4rem' }}>Eligibility</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{hackathon.eligibilityDomain || 'Open to all'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
