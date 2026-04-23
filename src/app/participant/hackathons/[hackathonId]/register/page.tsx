'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const STEPS = [
  { id: 'basic', title: 'Basic Details' },
  { id: 'user', title: 'User Details' },
  { id: 'academic', title: 'Academic Details' },
  { id: 'terms', title: 'Terms & Conditions' },
  { id: 'team', title: 'Team' },
];

const GENDERS = ['Female', 'Male', 'Transgender', 'Intersex', 'Non-binary', 'Prefer not to say', 'Other'];
const USER_TYPES = ['College Students', 'Professional', 'School Student', 'Fresher'];
const DOMAINS = ['Engineering', 'Design', 'Management', 'Science', 'Arts'];
const COURSES = ['B.Tech/BE', 'B.Sc', 'BCA', 'MBA', 'M.Tech', 'MCA', 'Other'];
const DURATIONS = ['2 Years', '3 Years', '4 Years', '5 Years', 'Other'];
const YEARS = [2026, 2027, 2028, 2029, 2030];

export default function HackathonRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const hackathonId = params.hackathonId as string;
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedRegistration, setSavedRegistration] = useState(false);
  const [error, setError] = useState('');
  const [hackathonInfo, setHackathonInfo] = useState<{ minTeamSize: number; maxTeamSize: number } | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [team, setTeam] = useState<any | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const isLead = (team?.members || []).some((m: any) => m.role === 'leader' && m.user?.id === currentUserId);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', gender: '', location: '',
    instituteName: '', differentlyAbled: false, userType: '', domain: '',
    course: '', courseSpecialization: '', graduatingYear: 2026, courseDuration: '', termsAccepted: false,
  });

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const [regRes, hackRes, profileRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/registration`),
          fetch(`/api/hackathons/${hackathonId}`),
          fetch('/api/users/profile'),
        ]);
        const regData = await regRes.json();
        const hackData = await hackRes.json();
        const profileData = await profileRes.json();
        setCurrentUserId(profileData?.user?.id || '');
        setSavedRegistration(!!regData.data);
        if (hackData?.data) setHackathonInfo({ minTeamSize: hackData.data.minTeamSize, maxTeamSize: hackData.data.maxTeamSize });
        const nameParts = (session?.user?.name || '').split(' ');
        const existing = regData.data;
        setForm((prev) => ({
          ...prev,
          firstName: existing?.firstName || nameParts[0] || '',
          lastName: existing?.lastName || nameParts.slice(1).join(' '),
          email: existing?.email || session?.user?.email || '',
          phone: existing?.phone || '', gender: existing?.gender || '', location: existing?.location || '',
          instituteName: existing?.instituteName || '', differentlyAbled: existing?.differentlyAbled || false,
          userType: existing?.userType || 'College Students', domain: existing?.domain || 'Engineering',
          course: existing?.course || COURSES[0], courseSpecialization: existing?.courseSpecialization || '',
          graduatingYear: existing?.graduatingYear || 2026, courseDuration: existing?.courseDuration || '4 Years',
          termsAccepted: existing?.termsAccepted || false,
        }));
        const allTeamsRes = await fetch(`/api/hackathons/${hackathonId}/teams`);
        const allTeamsData = await allTeamsRes.json();
        const myTeam = (allTeamsData.data || []).find((t: any) => (t.members || []).some((m: any) => m.user?.id === profileData?.user?.id));
        setTeam(myTeam || null);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId, session?.user?.email, session?.user?.name]);

  // Load teammate recommendations when on team step
  useEffect(() => {
    if (stepIndex !== 4 || !hackathonId || !savedRegistration) return;
    setLoadingRecs(true);
    (async () => {
      try {
        const [profileRes, teamsRes] = await Promise.all([
          fetch('/api/users/profile'),
          fetch(`/api/hackathons/${hackathonId}/teams`),
        ]);
        const profile = await profileRes.json();
        const teams = await teamsRes.json();
        const mySkills = profile.user?.profile?.skills || [];
        const allTeams = teams.data || [];
        const myId = profile.user?.id;

        // Find open teams that need members
        const openTeams = allTeams.filter((t: any) =>
          t.isOpen && !t.members.some((m: any) => m.user.id === myId) &&
          t.members.length < (hackathonInfo?.maxTeamSize || 5)
        );

        // Score teams by skill complementarity
        const scored = openTeams.map((t: any) => {
          const teamSkills = new Set(t.members.flatMap((m: any) => m.user?.profile?.skills || []));
          const overlap = mySkills.filter((s: string) => teamSkills.has(s)).length;
          const needed = (t.profile?.skillsNeeded || []).filter((s: string) => !teamSkills.has(s));
          const matchScore = needed.filter((s: string) => mySkills.includes(s)).length;
          return { team: t, score: matchScore * 2 + overlap, needsSkills: needed };
        }).sort((a: any, b: any) => b.score - a.score).slice(0, 5);

        // Also find participants looking for team
        const participantsRes = await fetch(`/api/hackathons/${hackathonId}/participants?q=`);
        const participantsData = await participantsRes.json();
        const lookingForTeam = (participantsData.data || [])
          .filter((p: any) => p.id !== myId && p.profile?.isLookingForTeam)
          .slice(0, 5);

        setRecommendations([
          ...scored.map((s: any) => ({ type: 'team', ...s })),
          ...lookingForTeam.map((p: any) => ({ type: 'participant', participant: p, score: p.profile?.skills?.filter((s: string) => mySkills.includes(s)).length || 0 })),
        ]);
      } catch { /* silent */ }
      finally { setLoadingRecs(false); }
    })();
  }, [stepIndex, hackathonId, savedRegistration, hackathonInfo]);

  const step = STEPS[stepIndex];
  const canContinue = useMemo(() => {
    if (step.id === 'basic') return form.firstName && form.email && form.phone && form.gender && form.location;
    if (step.id === 'user') return form.instituteName && form.userType && form.domain && form.course;
    if (step.id === 'academic') return form.courseSpecialization && form.courseDuration && form.graduatingYear;
    if (step.id === 'terms') return form.termsAccepted;
    return true;
  }, [form, step.id]);

  async function handleNext() {
    if (step.id === 'terms') {
      const ok = await saveRegistration();
      if (!ok) return;
      await loadTeam();
    }
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function saveRegistration() {
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/registration`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed'); return false; }
      setSavedRegistration(true);
      return true;
    } finally { setSaving(false); }
  }

  async function loadTeam() {
    const [teamsRes, profileRes] = await Promise.all([
      fetch(`/api/hackathons/${hackathonId}/teams`), fetch('/api/users/profile'),
    ]);
    const teamsData = await teamsRes.json();
    const profileData = await profileRes.json();
    setCurrentUserId(profileData?.user?.id || '');
    const myTeam = (teamsData.data || []).find((t: any) => (t.members || []).some((m: any) => m.user?.id === profileData?.user?.id));
    setTeam(myTeam || null);
  }

  async function createTeam() {
    if (!teamName.trim()) return;
    const res = await fetch(`/api/hackathons/${hackathonId}/teams`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName.trim(), description: teamDesc.trim(), maxMembers: hackathonInfo?.maxTeamSize || 5 }),
    });
    if (res.ok) { setTeamName(''); setTeamDesc(''); await loadTeam(); }
    else { const data = await res.json(); setError(data.error || 'Failed'); }
  }

  async function removeMember(memberId: string) {
    if (!team) return;
    await fetch(`/api/teams/${team.id}/members/${memberId}`, { method: 'DELETE' });
    loadTeam();
  }

  async function sendInviteEmail() {
    if (!team || !inviteEmail.trim()) return;
    setInviteStatus(''); setSendingInvite(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      setInviteStatus(res.ok ? 'Invite sent' : (data.error || 'Failed'));
      if (res.ok) setInviteEmail('');
    } finally { setSendingInvite(false); }
  }

  async function joinTeamRequest(teamId: string) {
    const res = await fetch(`/api/teams/${teamId}/join`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Joining via registration' }),
    });
    if (res.ok) setInviteStatus('Join request sent');
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
    <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
  </div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>Registration</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Hackathon Registration</h1>
      </div>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {STEPS.map((s, idx) => (
          <button key={s.id} onClick={() => { if (idx <= stepIndex || (idx === stepIndex + 1 && canContinue)) setStepIndex(idx); }} style={{
            padding: '0.35rem 0.75rem', borderRadius: 999, border: '1px solid',
            borderColor: idx === stepIndex ? 'var(--accent)' : idx < stepIndex ? 'rgba(62,207,142,0.3)' : 'var(--border-default)',
            background: idx === stepIndex ? 'var(--accent)' : idx < stepIndex ? 'rgba(62,207,142,0.08)' : 'var(--bg-raised)',
            color: idx === stepIndex ? 'var(--text-inverse)' : idx < stepIndex ? '#3ecf8e' : 'var(--text-secondary)',
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', cursor: 'pointer', fontWeight: idx === stepIndex ? 700 : 400,
          }}>{s.title}</button>
        ))}
      </div>

      {error && <div className="org-feedback org-feedback-error">{error}</div>}

      {/* Step Content */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1rem' }}>
        {/* BASIC */}
        {step.id === 'basic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="org-label" style={{ marginBottom: '0.25rem' }}>Personal Information</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={labelStyle}>First Name *</label><input className="org-input" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><label style={labelStyle}>Last Name</label><input className="org-input" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              <div><label style={labelStyle}>Email *</label><input className="org-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><label style={labelStyle}>Phone *</label><input className="org-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div>
              <label style={labelStyle}>Gender *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {GENDERS.map((g) => (
                  <button key={g} type="button" onClick={() => setForm({ ...form, gender: g })} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid',
                    borderColor: form.gender === g ? 'var(--accent)' : 'var(--border-default)',
                    background: form.gender === g ? 'var(--accent-dim)' : 'var(--bg-raised)',
                    color: form.gender === g ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>{g}</button>
                ))}
              </div>
            </div>
            <div><label style={labelStyle}>Location *</label><input className="org-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City, Country" /></div>
          </div>
        )}

        {/* USER */}
        {step.id === 'user' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="org-label" style={{ marginBottom: '0.25rem' }}>User Details</p>
            <div><label style={labelStyle}>Institute Name *</label><input className="org-input" value={form.instituteName} onChange={(e) => setForm({ ...form, instituteName: e.target.value })} /></div>
            <div>
              <label style={labelStyle}>Differently Abled *</label>
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem' }}>
                {['No', 'Yes'].map((opt) => (
                  <button key={opt} type="button" onClick={() => setForm({ ...form, differentlyAbled: opt === 'Yes' })} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid',
                    borderColor: form.differentlyAbled === (opt === 'Yes') ? 'var(--accent)' : 'var(--border-default)',
                    background: form.differentlyAbled === (opt === 'Yes') ? 'var(--accent-dim)' : 'var(--bg-raised)',
                    color: form.differentlyAbled === (opt === 'Yes') ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {USER_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, userType: t })} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid',
                    borderColor: form.userType === t ? 'var(--accent)' : 'var(--border-default)',
                    background: form.userType === t ? 'var(--accent-dim)' : 'var(--bg-raised)',
                    color: form.userType === t ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Domain *</label>
                <select className="org-select" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Course *</label>
                <select className="org-select" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}>
                  {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ACADEMIC */}
        {step.id === 'academic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="org-label" style={{ marginBottom: '0.25rem' }}>Academic Details</p>
            <div><label style={labelStyle}>Course Specialization *</label><input className="org-input" value={form.courseSpecialization} onChange={(e) => setForm({ ...form, courseSpecialization: e.target.value })} placeholder="e.g. Computer Science" /></div>
            <div>
              <label style={labelStyle}>Graduating Year *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {YEARS.map((y) => (
                  <button key={y} type="button" onClick={() => setForm({ ...form, graduatingYear: y })} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid',
                    borderColor: form.graduatingYear === y ? 'var(--accent)' : 'var(--border-default)',
                    background: form.graduatingYear === y ? 'var(--accent-dim)' : 'var(--bg-raised)',
                    color: form.graduatingYear === y ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>{y}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Course Duration *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.4rem' }}>
                {DURATIONS.map((d) => (
                  <button key={d} type="button" onClick={() => setForm({ ...form, courseDuration: d })} style={{
                    padding: '0.3rem 0.75rem', borderRadius: 999, border: '1px solid',
                    borderColor: form.courseDuration === d ? 'var(--accent)' : 'var(--border-default)',
                    background: form.courseDuration === d ? 'var(--accent-dim)' : 'var(--bg-raised)',
                    color: form.courseDuration === d ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--font-display)',
                  }}>{d}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TERMS */}
        {step.id === 'terms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p className="org-label" style={{ marginBottom: '0.25rem' }}>Terms & Conditions</p>
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
              <p className="org-text">By registering, you agree to share the information provided with the organizers for communication and event operations. You also agree to the platform privacy policy and terms of use.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <div className={`org-toggle ${form.termsAccepted ? 'org-toggle--active' : ''}`} onClick={() => setForm({ ...form, termsAccepted: !form.termsAccepted })}>
                <div className="org-toggle-thumb" />
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>I agree to the terms and conditions</span>
            </label>
          </div>
        )}

        {/* TEAM */}
        {step.id === 'team' && (
          <div>
            {!savedRegistration && (
              <div className="org-feedback org-feedback-error">Save your registration first to unlock team management.</div>
            )}
            {savedRegistration && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                {/* Team Management */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>Your Team</p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Size: {hackathonInfo ? `${hackathonInfo.minTeamSize}\u2013${hackathonInfo.maxTeamSize}` : '...'}</span>
                  </div>
                  {!team ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <input className="org-input" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Team name" />
                      <textarea className="org-input" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} placeholder="Description (optional)" style={{ minHeight: 60, resize: 'vertical' as const }} />
                      <button className="org-btn-primary" onClick={createTeam} disabled={!teamName.trim()} style={{ alignSelf: 'flex-start' }}>Create Team</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{team.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.members?.length || 0}/{hackathonInfo?.maxTeamSize || 0} members</p>
                        </div>
                        {isLead && <button className="org-btn-secondary" onClick={() => setShowInviteInput(!showInviteInput)} style={{ fontSize: '0.68rem' }}>Invite</button>}
                      </div>
                      {team.members?.map((m: any) => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 700 }}>
                              {m.user?.name?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{m.user?.name}</p>
                              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{m.role}</p>
                            </div>
                          </div>
                          {isLead && m.role !== 'leader' && (
                            <button onClick={() => removeMember(m.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '0.72rem', cursor: 'pointer' }}>Remove</button>
                          )}
                        </div>
                      ))}
                      {isLead && showInviteInput && (
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                          <input className="org-input" type="email" placeholder="teammate@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1 }} />
                          <button className="org-btn-primary" onClick={sendInviteEmail} disabled={sendingInvite || !inviteEmail.trim()}>
                            {sendingInvite ? '...' : 'Send'}
                          </button>
                        </div>
                      )}
                      {inviteStatus && <p style={{ fontSize: '0.78rem', color: inviteStatus.includes('sent') ? '#3ecf8e' : 'var(--text-muted)' }}>{inviteStatus}</p>}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <p className="org-label" style={{ marginBottom: '0.75rem' }}>Suggestions</p>
                  {loadingRecs ? (
                    <p className="org-text">Finding matches...</p>
                  ) : recommendations.length === 0 ? (
                    <p className="org-text">No suggestions yet. Check back after more participants register.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 300, overflowY: 'auto' }}>
                      {recommendations.map((rec: any, i: number) => (
                        <div key={i} style={{ padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                          {rec.type === 'team' ? (
                            <>
                              <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{rec.team.name}</p>
                              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{rec.team.members?.length}/{hackathonInfo?.maxTeamSize} members</p>
                              {rec.needsSkills?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.3rem' }}>
                                  {rec.needsSkills.slice(0, 3).map((s: string) => <span key={s} className="org-badge org-badge-info">{s}</span>)}
                                </div>
                              )}
                              {!team && <button className="org-btn-secondary" onClick={() => joinTeamRequest(rec.team.id)} style={{ fontSize: '0.65rem', marginTop: '0.4rem', padding: '0.25rem 0.5rem' }}>Request to Join</button>}
                            </>
                          ) : (
                            <>
                              <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{rec.participant.name}</p>
                              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{rec.participant.profile?.instituteName || ''}</p>
                              {rec.participant.profile?.skills?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.3rem' }}>
                                  {rec.participant.profile.skills.slice(0, 3).map((s: string) => <span key={s} className="org-badge org-badge-accent">{s}</span>)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="org-btn-secondary" onClick={() => stepIndex === 0 ? router.back() : setStepIndex((s) => s - 1)}>Back</button>
        {stepIndex < STEPS.length - 1 ? (
          <button className="org-btn-primary" onClick={handleNext} disabled={!canContinue || saving}>
            {saving && step.id === 'terms' ? 'Saving...' : 'Next'}
          </button>
        ) : (
          <button className="org-btn-primary" onClick={() => router.push(`/participant/hackathons/${hackathonId}`)}>Finish</button>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' };
