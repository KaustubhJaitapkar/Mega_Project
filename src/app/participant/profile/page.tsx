'use client';

import { useEffect, useMemo, useState } from 'react';

const SKILL_SUGGESTIONS = [
  'React',
  'Next.js',
  'Node.js',
  'Python',
  'TypeScript',
  'Machine Learning',
  'UI/UX',
  'Docker',
  'PostgreSQL',
  'Firebase',
];

export default function ParticipantProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    name: '',
    college: '',
    yearOfStudy: '',
    bio: '',
    skills: [] as string[],
    githubUsername: '',
    sponsorVisible: true,
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/users/profile');
        const data = await res.json();
        const user = data.user || {};
        const profile = user.profile || {};
        setForm({
          name: user.name || '',
          college: profile.company || '',
          yearOfStudy: profile.experience || '',
          bio: profile.bio || '',
          skills: profile.skills || [],
          githubUsername: user.githubUsername || '',
          sponsorVisible: profile.isPublic ?? true,
        });
      } catch (e) {
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const filteredSuggestions = useMemo(
    () =>
      SKILL_SUGGESTIONS.filter(
        (s) =>
          s.toLowerCase().includes(skillInput.toLowerCase()) &&
          !form.skills.includes(s)
      ),
    [skillInput, form.skills]
  );

  function addSkill(skill: string) {
    if (!skill.trim() || form.skills.includes(skill) || form.skills.length >= 15) return;
    setForm((prev) => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
    setSkillInput('');
  }

  function removeSkill(skill: string) {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);
    try {
      const githubValid =
        !form.githubUsername ||
        /^https:\/\/github\.com\/[a-zA-Z0-9-]{1,39}\/?$/.test(
          `https://github.com/${form.githubUsername}`
        );
      if (!githubValid) {
        setError('Invalid GitHub username');
        return;
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save profile');
        return;
      }
      setSuccess('Profile updated successfully');
    } catch (e) {
      setError('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Onboarding</h1>
      <p className="text-gray-600 mb-6">Complete your participant profile for team discovery.</p>

      <form onSubmit={handleSave} className="card space-y-5">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">College</label>
            <input className="input" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Year of Study</label>
          <input className="input" value={form.yearOfStudy} onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })} placeholder="1st year / 2nd year / final year" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea className="input min-h-24" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills ({form.skills.length}/15)</label>
          <div className="flex gap-2">
            <input className="input flex-1" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add skill tag" />
            <button type="button" className="btn btn-secondary" onClick={() => addSkill(skillInput)}>Add</button>
          </div>
          {filteredSuggestions.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {filteredSuggestions.slice(0, 6).map((s) => (
                <button key={s} type="button" onClick={() => addSkill(s)} className="badge badge-secondary">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap mt-3">
            {form.skills.map((skill) => (
              <span key={skill} className="badge badge-primary">
                {skill} <button type="button" onClick={() => removeSkill(skill)}>x</button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">GitHub Username</label>
          <input className="input" value={form.githubUsername} onChange={(e) => setForm({ ...form, githubUsername: e.target.value })} />
          {form.githubUsername && (
            <a className="text-indigo-600 text-sm mt-1 inline-block" href={`https://github.com/${form.githubUsername}`} target="_blank" rel="noreferrer">
              Verify profile link
            </a>
          )}
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.sponsorVisible} onChange={(e) => setForm({ ...form, sponsorVisible: e.target.checked })} />
          Sponsor Visibility (opt-in to appear in sponsor talent pool)
        </label>

        <button className="btn btn-primary w-full" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
