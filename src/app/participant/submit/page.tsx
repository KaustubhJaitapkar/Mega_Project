'use client';

import { useEffect, useState } from 'react';

export default function ParticipantSubmitPage() {
  const [teamId, setTeamId] = useState('');
  const [submission, setSubmission] = useState<any>(null);
  const [form, setForm] = useState({
    githubUrl: '',
    liveUrl: '',
    description: '',
    technologies: [] as string[],
  });
  const [tech, setTech] = useState('');
  const [status, setStatus] = useState<'checking' | 'healthy' | 'broken' | 'idle'>('idle');
  const [issues, setIssues] = useState<string[]>([]);
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  useEffect(() => {
    async function resolveTeam() {
      const profile = await fetch('/api/users/profile').then((r) => r.json());
      const userId = profile.user?.id;
      const hacks = await fetch('/api/hackathons?limit=50').then((r) => r.json());
      for (const h of hacks.data || []) {
        const teams = await fetch(`/api/hackathons/${h.id}/teams`).then((r) => r.json());
        const mine = (teams.data || []).find((t: any) => t.members.some((m: any) => m.user.id === userId));
        if (mine) {
          setTeamId(mine.id);
          setDeadlinePassed(new Date() > new Date(h.submissionDeadline));
          return;
        }
      }
    }
    resolveTeam();
  }, []);

  useEffect(() => {
    if (!teamId) return;
    async function load() {
      const res = await fetch(`/api/teams/${teamId}/submission`);
      const data = await res.json();
      setSubmission(data.data);
      if (data.data) {
        setForm({
          githubUrl: data.data.githubUrl || '',
          liveUrl: data.data.liveUrl || '',
          description: data.data.description || '',
          technologies: data.data.technologies || [],
        });
      }
    }
    load();
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/teams/${teamId}/submission`);
      const data = await res.json();
      setSubmission(data.data);
    }, 3000);
    return () => clearInterval(timer);
  }, [teamId]);

  function addTech() {
    if (!tech.trim() || form.technologies.includes(tech.trim())) return;
    setForm((p) => ({ ...p, technologies: [...p.technologies, tech.trim()] }));
    setTech('');
  }

  async function saveSubmission() {
    if (!teamId) return;
    if (form.githubUrl && !/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(form.githubUrl)) {
      setIssues(['GitHub URL must match repository format']);
      return;
    }
    if (form.description.length < 20) {
      setIssues(['Description should be at least 20 characters']);
      return;
    }

    setStatus('checking');
    const res = await fetch(`/api/teams/${teamId}/submission`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmission(data.data);
      setIssues(data.issues || []);
      setStatus(data.healthStatus === 'healthy' ? 'healthy' : 'broken');
    } else {
      setIssues([data.error || 'Submission failed']);
      setStatus('broken');
    }
  }

  return (
    <div className="p-8 space-y-5 max-w-4xl">
      <h1 className="text-3xl font-bold">Submission</h1>
      {deadlinePassed && <div className="p-3 rounded bg-red-100 text-red-700">Submission deadline passed. Form is disabled.</div>}
      <div className="card space-y-4">
        <input className="input" placeholder="GitHub URL" value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} disabled={deadlinePassed} />
        <input className="input" placeholder="Live URL" value={form.liveUrl} onChange={(e) => setForm({ ...form, liveUrl: e.target.value })} disabled={deadlinePassed} />
        <textarea className="input min-h-28" placeholder="Project description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={deadlinePassed} />
        <div className="flex gap-2">
          <input className="input" placeholder="Technology" value={tech} onChange={(e) => setTech(e.target.value)} disabled={deadlinePassed} />
          <button className="btn btn-secondary" onClick={addTech} disabled={deadlinePassed}>Add</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.technologies.map((t) => (
            <span key={t} className="badge badge-primary">{t}</span>
          ))}
        </div>
        <button className="btn btn-primary" onClick={saveSubmission} disabled={deadlinePassed || status === 'checking'}>
          {status === 'checking' ? 'Checking health...' : 'Create / Update Submission'}
        </button>
      </div>

      <div className="card">
        <p className="font-semibold">Status Tracking</p>
        <p className="text-sm">Health: {status}</p>
        <p className="text-sm">Submission Status: {submission?.status || 'NOT_SUBMITTED'}</p>
        {issues.length > 0 && (
          <ul className="text-sm text-red-600 list-disc pl-5 mt-2">
            {issues.map((i) => <li key={i}>{i}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
