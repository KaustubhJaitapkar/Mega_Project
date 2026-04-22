'use client';

import { useEffect, useState } from 'react';

export default function SponsorDashboardPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');
  const [college, setCollege] = useState('');
  const [experience, setExperience] = useState('');
  const [message, setMessage] = useState({ hackathonId: '', title: '', content: '' });
  const [prize, setPrize] = useState({ hackathonId: '', userId: '', type: 'BEST_PROJECT', title: '', description: '' });
  const [branding, setBranding] = useState({ logoUrl: '', tier: 'title' });
  const [notice, setNotice] = useState('');

  async function loadParticipants() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (skill) params.set('skill', skill);
    if (college) params.set('college', college);
    if (experience) params.set('experience', experience);
    const res = await fetch(`/api/sponsor/participants?${params.toString()}`);
    const data = await res.json();
    setParticipants(data.data || []);
  }

  useEffect(() => {
    loadParticipants();
  }, [search, skill, college, experience]);

  async function sendSponsorMessage() {
    const res = await fetch('/api/sponsor/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    const data = await res.json();
    setNotice(res.ok ? 'Opportunity broadcasted' : data.error || 'Failed to send message');
  }

  async function assignPrize() {
    const res = await fetch('/api/sponsor/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prize),
    });
    const data = await res.json();
    setNotice(res.ok ? 'Prize assigned' : data.error || 'Failed to assign prize');
  }

  async function saveBranding() {
    const res = await fetch('/api/sponsor/branding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding),
    });
    const data = await res.json();
    setNotice(res.ok ? 'Branding saved' : data.error || 'Failed to save branding');
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Sponsor Dashboard</h1>
        <p className="text-gray-600 mt-2">Discover opt-in participants and drive engagement</p>
      </div>
      {notice && <div className="p-3 rounded bg-indigo-100 text-indigo-700">{notice}</div>}

      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Participant Discovery (opt-in only)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input className="input" placeholder="Keyword search" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input" placeholder="Skill match" value={skill} onChange={(e) => setSkill(e.target.value)} />
          <input className="input" placeholder="College" value={college} onChange={(e) => setCollege(e.target.value)} />
          <input className="input" placeholder="Experience" value={experience} onChange={(e) => setExperience(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {participants.map((p) => (
            <div key={p.id} className="border rounded p-3">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-600">{p.profile?.bio || 'No bio'}</p>
              <p className="text-sm mt-1">Skills: {(p.profile?.skills || []).join(', ') || 'N/A'}</p>
              <p className="text-sm">GitHub: {p.githubUsername ? `github.com/${p.githubUsername}` : 'N/A'}</p>
              <p className="text-sm">College: {p.profile?.company || 'N/A'}</p>
              <p className="text-sm">Experience: {p.profile?.experience || 'N/A'}</p>
            </div>
          ))}
          {participants.length === 0 && <p className="text-sm text-gray-600">No opt-in participants match filters.</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-3">
          <h3 className="font-semibold">Engagement</h3>
          <input className="input" placeholder="Hackathon ID" value={message.hackathonId} onChange={(e) => setMessage({ ...message, hackathonId: e.target.value })} />
          <input className="input" placeholder="Title" value={message.title} onChange={(e) => setMessage({ ...message, title: e.target.value })} />
          <textarea className="input min-h-24" placeholder="Broadcast opportunities" value={message.content} onChange={(e) => setMessage({ ...message, content: e.target.value })} />
          <button className="btn btn-primary" onClick={sendSponsorMessage}>Send Sponsor Message</button>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Prize Management</h3>
          <input className="input" placeholder="Hackathon ID" value={prize.hackathonId} onChange={(e) => setPrize({ ...prize, hackathonId: e.target.value })} />
          <input className="input" placeholder="User ID" value={prize.userId} onChange={(e) => setPrize({ ...prize, userId: e.target.value })} />
          <select className="input" value={prize.type} onChange={(e) => setPrize({ ...prize, type: e.target.value })}>
            <option value="BEST_PROJECT">best_project</option>
            <option value="WINNER">winner</option>
            <option value="RUNNER_UP">runner_up</option>
            <option value="PARTICIPANT">participant</option>
          </select>
          <input className="input" placeholder="Prize Title" value={prize.title} onChange={(e) => setPrize({ ...prize, title: e.target.value })} />
          <textarea className="input min-h-20" placeholder="Description" value={prize.description} onChange={(e) => setPrize({ ...prize, description: e.target.value })} />
          <button className="btn btn-primary" onClick={assignPrize}>Create / Assign Prize</button>
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold">Branding</h3>
          <input className="input" placeholder="Logo URL" value={branding.logoUrl} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })} />
          <select className="input" value={branding.tier} onChange={(e) => setBranding({ ...branding, tier: e.target.value })}>
            <option value="title">title</option>
            <option value="gold">gold</option>
            <option value="silver">silver</option>
          </select>
          <button className="btn btn-primary" onClick={saveBranding}>Save Branding</button>
        </div>
      </div>
    </div>
  );
}
