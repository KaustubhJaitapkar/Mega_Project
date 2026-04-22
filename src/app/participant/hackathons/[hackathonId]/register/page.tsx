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
const COURSES = [
  'B.Tech/BE (Bachelor of Technology / Bachelor of Engineering)',
  'B.Sc',
  'BCA',
  'MBA',
  'M.Tech',
  'MCA',
  'Other',
];
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

  const isLead = (team?.members || []).some(
    (m: any) => m.role === 'leader' && m.user?.id === currentUserId
  );
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    location: '',
    instituteName: '',
    differentlyAbled: false,
    userType: '',
    domain: '',
    course: '',
    courseSpecialization: '',
    graduatingYear: 2026,
    courseDuration: '',
    termsAccepted: false,
  });

  useEffect(() => {
    async function boot() {
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
        const existing = regData.data || null;
        setSavedRegistration(!!existing);
        if (hackData?.data) {
          setHackathonInfo({
            minTeamSize: hackData.data.minTeamSize,
            maxTeamSize: hackData.data.maxTeamSize,
          });
        }
        const nameParts = (session?.user?.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ');
        setForm((prev) => ({
          ...prev,
          firstName: existing?.firstName || firstName,
          lastName: existing?.lastName || lastName,
          email: existing?.email || session?.user?.email || '',
          phone: existing?.phone || '',
          gender: existing?.gender || '',
          location: existing?.location || '',
          instituteName: existing?.instituteName || '',
          differentlyAbled: existing?.differentlyAbled || false,
          userType: existing?.userType || 'College Students',
          domain: existing?.domain || 'Engineering',
          course: existing?.course || COURSES[0],
          courseSpecialization: existing?.courseSpecialization || '',
          graduatingYear: existing?.graduatingYear || 2026,
          courseDuration: existing?.courseDuration || '4 Years',
          termsAccepted: existing?.termsAccepted || false,
        }));

        const allTeamsRes = await fetch(`/api/hackathons/${hackathonId}/teams`);
        const allTeamsData = await allTeamsRes.json();
        const myId = profileData?.user?.id;
        const myTeam = (allTeamsData.data || []).find((t: any) =>
          (t.members || []).some((m: any) => m.user?.id === myId)
        );
        setTeam(myTeam || null);
      } catch (err) {
        console.error('Failed to load registration', err);
      } finally {
        setLoading(false);
      }
    }

    if (hackathonId) boot();
  }, [hackathonId, session?.user?.email, session?.user?.name]);

  const step = STEPS[stepIndex];
  const canContinue = useMemo(() => {
    if (step.id === 'basic') {
      return form.firstName && form.email && form.phone && form.gender && form.location;
    }
    if (step.id === 'user') {
      return form.instituteName && form.userType && form.domain && form.course;
    }
    if (step.id === 'academic') {
      return form.courseSpecialization && form.courseDuration && form.graduatingYear;
    }
    if (step.id === 'terms') {
      return form.termsAccepted;
    }
    if (step.id === 'team') {
      return true;
    }
    return false;
  }, [form, step.id]);

  async function handleNext() {
    if (step.id === 'terms') {
      const ok = await saveRegistration();
      if (!ok) return;
      await loadTeam();
    }
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveRegistration() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save registration');
        return false;
      }
      setSavedRegistration(true);
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function loadTeam() {
    const [teamsRes, profileRes] = await Promise.all([
      fetch(`/api/hackathons/${hackathonId}/teams`),
      fetch('/api/users/profile'),
    ]);
    const teamsData = await teamsRes.json();
    const profileData = await profileRes.json();
    const myId = profileData?.user?.id;
    setCurrentUserId(myId || '');
    const myTeam = (teamsData.data || []).find((t: any) =>
      (t.members || []).some((m: any) => m.user?.id === myId)
    );
    setTeam(myTeam || null);
  }

  async function createTeam() {
    if (!teamName.trim()) return;
    const res = await fetch(`/api/hackathons/${hackathonId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: teamName.trim(),
        description: teamDesc.trim(),
        maxMembers: hackathonInfo?.maxTeamSize || 5,
      }),
    });
    if (res.ok) {
      setTeamName('');
      setTeamDesc('');
      await loadTeam();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create team');
    }
  }

  async function removeMember(memberId: string) {
    if (!team) return;
    await fetch(`/api/teams/${team.id}/members/${memberId}`, { method: 'DELETE' });
    loadTeam();
  }

  async function sendInviteEmail() {
    if (!team || !inviteEmail.trim()) return;
    setInviteStatus('');
    setSendingInvite(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteStatus(data.error || 'Failed to send invite');
        return;
      }
      setInviteStatus('Invite sent');
      setInviteEmail('');
    } finally {
      setSendingInvite(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h1 className="text-3xl font-bold text-slate-900">Registration Form</h1>
            <p className="text-sm text-slate-500 mt-1">Complete the form to register for this hackathon.</p>
          </div>

          <div className="px-8 pt-6">
            <div className="flex gap-3 text-sm">
              {STEPS.map((s, idx) => (
                <div
                  key={s.id}
                  className={`px-3 py-1 rounded-full border ${
                    idx === stepIndex
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  {s.title}
                </div>
              ))}
            </div>
          </div>

          <div className="px-8 py-6">
            {step.id === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">First Name *</label>
                    <input
                      className="input"
                      value={form.firstName}
                      onChange={(e) => updateField('firstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Last Name</label>
                    <input
                      className="input"
                      value={form.lastName}
                      onChange={(e) => updateField('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Email *</label>
                    <input
                      className="input"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Mobile *</label>
                    <input
                      className="input"
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Gender *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {GENDERS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateField('gender', g)}
                        className={`px-4 py-2 rounded-full border text-sm ${
                          form.gender === g
                            ? 'border-blue-600 text-blue-700 bg-blue-50'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Location *</label>
                  <input
                    className="input"
                    value={form.location}
                    onChange={(e) => updateField('location', e.target.value)}
                  />
                </div>
              </div>
            )}

            {step.id === 'user' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Institute Name *</label>
                  <input
                    className="input"
                    value={form.instituteName}
                    onChange={(e) => updateField('instituteName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Differently Abled *</label>
                  <div className="flex gap-2 mt-2">
                    {['No', 'Yes'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateField('differentlyAbled', opt === 'Yes')}
                        className={`px-4 py-2 rounded-full border text-sm ${
                          form.differentlyAbled === (opt === 'Yes')
                            ? 'border-blue-600 text-blue-700 bg-blue-50'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Type *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {USER_TYPES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateField('userType', t)}
                        className={`px-4 py-2 rounded-full border text-sm ${
                          form.userType === t
                            ? 'border-blue-600 text-blue-700 bg-blue-50'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Domain *</label>
                    <select
                      className="input"
                      value={form.domain}
                      onChange={(e) => updateField('domain', e.target.value)}
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Course *</label>
                    <select
                      className="input"
                      value={form.course}
                      onChange={(e) => updateField('course', e.target.value)}
                    >
                      {COURSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step.id === 'academic' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Course Specialization *</label>
                  <input
                    className="input"
                    value={form.courseSpecialization}
                    onChange={(e) => updateField('courseSpecialization', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Graduating Year *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {YEARS.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => updateField('graduatingYear', y)}
                        className={`px-4 py-2 rounded-full border text-sm ${
                          form.graduatingYear === y
                            ? 'border-blue-600 text-blue-700 bg-blue-50'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Course Duration *</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateField('courseDuration', d)}
                        className={`px-4 py-2 rounded-full border text-sm ${
                          form.courseDuration === d
                            ? 'border-blue-600 text-blue-700 bg-blue-50'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step.id === 'terms' && (
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  <p className="text-sm text-slate-600">
                    By registering, you agree to share the information provided with the organizers for
                    communication and event operations. You also agree to the platform privacy policy
                    and terms of use.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={(e) => updateField('termsAccepted', e.target.checked)}
                  />
                  I agree to the terms and conditions.
                </label>
              </div>
            )}

            {step.id === 'team' && (
              <div className="space-y-5">
                {!savedRegistration && (
                  <div className="border border-amber-200 bg-amber-50 rounded-2xl p-4 text-sm text-amber-700">
                    Save your registration to unlock team management.
                  </div>
                )}

                {savedRegistration && (
                  <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">Create a team</h3>
                        <div className="text-xs text-slate-500">Team size {hackathonInfo ? `${hackathonInfo.minTeamSize}-${hackathonInfo.maxTeamSize}` : '...'}
                        </div>
                      </div>

                      {!team ? (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Team Name *</label>
                            <input
                              className="input"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              placeholder="Your team name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <textarea
                              className="input"
                              value={teamDesc}
                              onChange={(e) => setTeamDesc(e.target.value)}
                              placeholder="Short team description"
                              rows={3}
                            />
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={createTeam}
                            disabled={!teamName.trim()}
                          >
                            Create Team
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm text-slate-500">Team Name</div>
                              <div className="text-lg font-semibold text-slate-900">{team.name}</div>
                            </div>
                            <button
                              type="button"
                              className="text-sm text-slate-500"
                              onClick={() => setShowInviteInput(true)}
                            >
                              Invite Friends
                            </button>
                          </div>

                          <div className="border border-emerald-100 bg-emerald-50 rounded-xl p-3">
                            <div className="text-sm text-emerald-700">
                              Teammates ({team.members?.length || 0}/{hackathonInfo?.maxTeamSize || 0})
                            </div>
                          </div>

                          <div className="space-y-2">
                            {(team.members || []).map((m: any) => (
                              <div key={m.id} className="flex items-center justify-between border rounded-xl p-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold">
                                    {m.user?.name?.charAt(0) || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-900">{m.user?.name}</div>
                                    <div className="text-xs text-slate-500">{m.role}</div>
                                  </div>
                                </div>
                                {isLead && m.role !== 'leader' && (
                                  <button
                                    type="button"
                                    className="text-sm text-red-600"
                                    onClick={() => removeMember(m.id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          {isLead && (
                            <div className="flex gap-3">
                              <button
                                type="button"
                                className="btn btn-secondary flex-1"
                                onClick={() => setShowInviteInput(true)}
                              >
                                Add Member
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary flex-1"
                                onClick={() => setShowInviteInput(true)}
                              >
                                Invite Friends
                              </button>
                            </div>
                          )}

                          {isLead && showInviteInput && (
                            <div className="border-t pt-4 space-y-2">
                              <div className="text-sm font-semibold text-slate-700">Invite teammate by email</div>
                              <div className="flex gap-2">
                                <input
                                  className="input flex-1"
                                  type="email"
                                  placeholder="teammate@email.com"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={sendInviteEmail}
                                  disabled={sendingInvite}
                                >
                                  {sendingInvite ? 'Sending...' : 'Send Request'}
                                </button>
                              </div>
                              {inviteStatus && <p className="text-sm text-slate-600">{inviteStatus}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl p-5 bg-white">
                      <div className="flex gap-2 mb-4">
                        <div className="flex-1 rounded-full bg-slate-100 text-slate-700 text-sm px-3 py-2 text-center">
                          Invitations 0
                        </div>
                        <div className="flex-1 rounded-full bg-slate-100 text-slate-700 text-sm px-3 py-2 text-center">
                          Requests 0
                        </div>
                      </div>

                      <div className="text-sm font-semibold text-slate-700 mb-2">Past teammates</div>
                      <div className="text-xs text-slate-500 border border-dashed rounded-xl p-3">
                        Click on add to invite teammates once they are available.
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="text-xs text-slate-500">Teams seeking to join</div>
                        <div className="text-xs text-slate-400">No suggestions yet.</div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="text-xs text-slate-500">Players seeking to join</div>
                        <div className="text-xs text-slate-400">No suggestions yet.</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
          </div>

          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => (stepIndex === 0 ? router.back() : setStepIndex((s) => s - 1))}
            >
              Back
            </button>
            {stepIndex < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!canContinue || saving}
              >
                {saving && step.id === 'terms' ? 'Saving...' : 'Next'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => router.push(`/participant/hackathons/${hackathonId}`)}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
