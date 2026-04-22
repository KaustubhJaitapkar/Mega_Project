'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Team = {
  id: string;
  name: string;
  description?: string;
  members: Array<{ id: string; role: string; user: { id: string; name: string } }>;
  creatorId: string;
  isOpen: boolean;
  maxMembers: number;
  profile?: any;
};

type JoinRequest = {
  id: string;
  userId: string;
  message?: string;
  createdAt: string;
};

type GhostSlot = { id: string; skillNeeded: string; filled: boolean };

const COMPLEMENTARY_SKILLS: Record<string, string[]> = {
  React: ['UI/UX', 'TypeScript'],
  'Next.js': ['Node.js', 'TypeScript'],
  Python: ['Machine Learning', 'Data Science'],
  'Node.js': ['PostgreSQL', 'Docker'],
};

export default function MyTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHackathonId = searchParams.get('hackathonId') || '';
  const inviteRequestId = searchParams.get('inviteRequestId') || '';
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [hackathonId, setHackathonId] = useState(initialHackathonId);
  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [incoming, setIncoming] = useState<JoinRequest[]>([]);
  const [outgoing, setOutgoing] = useState<JoinRequest[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [skillFilter, setSkillFilter] = useState('');
  const [search, setSearch] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [message, setMessage] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [ghostSkill, setGhostSkill] = useState('');
  const [ghostSlots, setGhostSlots] = useState<GhostSlot[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [invitingId, setInvitingId] = useState('');
  const [inviteAutoProcessing, setInviteAutoProcessing] = useState(false);
  const [assignedMentor, setAssignedMentor] = useState<{ id: string; name: string; email?: string } | null>(null);

  const isLead = myTeam && myTeam.members.some((m) => m.role === 'leader');

  useEffect(() => {
    async function boot() {
      const [hRes, pRes] = await Promise.all([
        fetch('/api/hackathons?limit=50'),
        fetch('/api/users/profile'),
      ]);
      const hData = await hRes.json();
      const pData = await pRes.json();
      setHackathons(hData.data || []);
      setMySkills(pData?.user?.profile?.skills || []);
      if (!hackathonId && hData.data?.[0]?.id) setHackathonId(hData.data[0].id);
    }
    boot();
  }, []);

  const loadTeams = useCallback(async () => {
    if (!hackathonId) return;
    setError('');
    const regRes = await fetch(`/api/hackathons/${hackathonId}/register`);
    const regData = await regRes.json();
    const registered = !!regData?.data?.registered;
    setIsRegistered(registered);

    const tRes = await fetch(`/api/hackathons/${hackathonId}/teams`);
    const tData = await tRes.json();
    const allTeams = tData.data || [];
    setTeams(allTeams);

    const pRes = await fetch('/api/users/profile');
    const pData = await pRes.json();
    const me = pData.user?.id;
    const mine = allTeams.find((t: Team) => t.members.some((m) => m.user.id === me)) || null;
    setMyTeam(mine);

    if (mine) {
      const incomingRes = await fetch(`/api/teams/${mine.id}/requests?type=incoming`);
      const incomingData = await incomingRes.json();
      setIncoming(incomingData.data || []);

      const outgoingRes = await fetch(`/api/teams/${mine.id}/requests?type=outgoing`);
      const outgoingData = await outgoingRes.json();
      setOutgoing(outgoingData.data || []);

      const stored = localStorage.getItem(`ghost-slots:${mine.id}`);
      setGhostSlots(stored ? JSON.parse(stored) : []);
      setInvites([]);

      const mentorRes = await fetch(`/api/teams/${mine.id}/chat`);
      const mentorData = await mentorRes.json();
      setAssignedMentor(mentorRes.ok ? mentorData?.data?.mentors?.[0] || null : null);
    } else {
      const invitesRes = await fetch('/api/teams/invites');
      const invitesData = await invitesRes.json();
      setInvites(invitesData.data || []);
      setIncoming([]);
      setOutgoing([]);
      setGhostSlots([]);
      setAssignedMentor(null);
    }
  }, [hackathonId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    async function autoAcceptInvite() {
      if (!inviteRequestId || inviteAutoProcessing || myTeam) return;
      setInviteAutoProcessing(true);
      try {
        const res = await fetch(`/api/teams/invites/${inviteRequestId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setInviteStatus(data.error || 'Failed to accept invite');
        } else {
          setInviteStatus('Invitation accepted. You have been added to the team.');
          await loadTeams();
        }
      } finally {
        setInviteAutoProcessing(false);
      }
    }
    autoAcceptInvite();
  }, [inviteRequestId, myTeam, inviteAutoProcessing, loadTeams]);

  function goToRegistration() {
    if (!hackathonId) return;
    router.push(`/participant/hackathons/${hackathonId}/register`);
  }

  useEffect(() => {
    if (!myTeam) return;
    localStorage.setItem(`ghost-slots:${myTeam.id}`, JSON.stringify(ghostSlots));
  }, [ghostSlots, myTeam]);

  useEffect(() => {
    async function loadParticipants() {
      if (!isLead || !hackathonId || !myTeam) return;
      setLoadingParticipants(true);
      try {
        const res = await fetch(
          `/api/hackathons/${hackathonId}/participants?q=${encodeURIComponent(participantSearch)}`
        );
        const data = await res.json();
        setParticipants(data.data || []);
      } finally {
        setLoadingParticipants(false);
      }
    }
    loadParticipants();
  }, [isLead, hackathonId, myTeam, participantSearch]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (!t.isOpen) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (skillFilter) {
        const slots: GhostSlot[] = JSON.parse(localStorage.getItem(`ghost-slots:${t.id}`) || '[]');
        const hasSkill = slots.some((s) => s.skillNeeded.toLowerCase().includes(skillFilter.toLowerCase()) && !s.filled);
        if (!hasSkill) return false;
      }
      return true;
    });
  }, [teams, search, skillFilter]);

  const recommendations = useMemo(() => {
    const scored = filteredTeams
      .filter((t) => !myTeam || t.id !== myTeam.id)
      .map((team) => {
        const slots: GhostSlot[] = JSON.parse(localStorage.getItem(`ghost-slots:${team.id}`) || '[]');
        let score = 0;
        for (const slot of slots.filter((s) => !s.filled)) {
          if (mySkills.some((s) => s.toLowerCase() === slot.skillNeeded.toLowerCase())) score += 2;
          else {
            for (const skill of mySkills) {
              if ((COMPLEMENTARY_SKILLS[skill] || []).includes(slot.skillNeeded)) score += 1;
            }
          }
        }
        return { team, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const dismissed = JSON.parse(localStorage.getItem('dismissed-reco') || '[]') as string[];
    return scored.filter((x) => !dismissed.includes(x.team.id));
  }, [filteredTeams, mySkills, myTeam]);

  async function createTeam() {
    if (!teamName.trim() || teamName.trim().length < 2) return;
    const res = await fetch(`/api/hackathons/${hackathonId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName, description: teamDesc, maxMembers: 5 }),
    });
    if (res.ok) await loadTeams();
  }

  async function sendRequest(teamId: string) {
    await fetch(`/api/teams/${teamId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    setMessage('');
    await loadTeams();
  }

  async function cancelOutgoing(teamId: string, requestId: string) {
    await fetch(`/api/teams/${teamId}/join?requestId=${requestId}`, { method: 'DELETE' });
    await loadTeams();
  }

  async function accept(teamId: string, requestId: string) {
    await fetch(`/api/teams/${teamId}/requests/${requestId}`, { method: 'POST' });
    await loadTeams();
  }

  async function reject(teamId: string, requestId: string) {
    await fetch(`/api/teams/${teamId}/requests/${requestId}`, { method: 'DELETE' });
    await loadTeams();
  }

  async function leaveTeam() {
    if (!myTeam) return;
    await fetch(`/api/teams/${myTeam.id}/leave`, { method: 'POST' });
    await loadTeams();
  }

  async function removeMember(memberId: string) {
    if (!myTeam) return;
    await fetch(`/api/teams/${myTeam.id}/members/${memberId}`, { method: 'DELETE' });
    await loadTeams();
  }

  async function sendTeammateInvite() {
    if (!myTeam || !inviteEmail.trim()) return;
    setInviteStatus('');
    setSendingInvite(true);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteStatus(data.error || 'Failed to send invite');
        return;
      }
      setInviteStatus('Invitation email sent');
      setInviteEmail('');
    } finally {
      setSendingInvite(false);
    }
  }

  async function sendInviteRequest(userId: string) {
    if (!myTeam) return;
    setInvitingId(userId);
    try {
      const res = await fetch(`/api/teams/${myTeam.id}/invite-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: inviteNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteStatus(data.error || 'Failed to send invite');
        return;
      }
      setInviteStatus('Invite sent');
      loadTeams();
    } finally {
      setInvitingId('');
    }
  }

  async function acceptInvite(requestId: string) {
    await fetch(`/api/teams/invites/${requestId}`, { method: 'POST' });
    loadTeams();
  }

  async function rejectInvite(requestId: string) {
    await fetch(`/api/teams/invites/${requestId}`, { method: 'DELETE' });
    loadTeams();
  }

  function addGhostSlot() {
    if (!ghostSkill.trim() || !myTeam) return;
    setGhostSlots((prev) => [...prev, { id: crypto.randomUUID(), skillNeeded: ghostSkill.trim(), filled: false }]);
    setGhostSkill('');
  }

  function dismissReco(teamId: string) {
    const dismissed = JSON.parse(localStorage.getItem('dismissed-reco') || '[]') as string[];
    localStorage.setItem('dismissed-reco', JSON.stringify([...dismissed, teamId]));
    loadTeams();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex gap-3 items-center">
        <h1 className="text-3xl font-bold">My Team</h1>
        <select className="input max-w-sm" value={hackathonId} onChange={(e) => setHackathonId(e.target.value)}>
          {hackathons.map((h) => (
            <option key={h.id} value={h.id}>{h.title}</option>
          ))}
        </select>
      </div>
      {inviteAutoProcessing && (
        <div className="card">
          <p className="text-sm text-gray-600">Processing team invitation...</p>
        </div>
      )}

      {!isRegistered && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="font-semibold">Register for this hackathon first</p>
            <p className="text-sm text-gray-600">You need registration before creating or joining teams.</p>
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
          </div>
          <button className="btn btn-primary" onClick={goToRegistration} disabled={registering}>
            Register Now
          </button>
        </div>
      )}

      {!myTeam ? (
        <div className="card space-y-3">
          <h2 className="text-xl font-semibold">Create Team</h2>
          <input className="input" placeholder="Team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
          <textarea className="input" placeholder="Description (optional)" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} />
          <button className="btn btn-primary" onClick={createTeam} disabled={!isRegistered}>Create Team</button>
        </div>
      ) : (
        <div className="card">
          <h2 className="text-xl font-semibold">{myTeam.name}</h2>
          <p className="text-gray-600 mb-3">{myTeam.description || 'No description'}</p>
          <div className="space-y-2">
            {myTeam.members.map((m) => (
              <div key={m.id} className="flex justify-between p-2 border rounded">
                <span>{m.user.name} ({m.role === 'leader' ? 'lead' : 'member'})</span>
                {isLead && m.role !== 'leader' && (
                  <button className="text-red-600" onClick={() => removeMember(m.id)}>Remove</button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-secondary" onClick={leaveTeam}>Leave Team</button>
              <button
                className="btn btn-primary"
                onClick={() => router.push(`/participant/my-team/mentor-chat?teamId=${myTeam.id}&hackathonId=${hackathonId}`)}
                disabled={!assignedMentor}
              >
                {assignedMentor ? 'Chat with Mentor' : 'Mentor not assigned'}
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {assignedMentor ? `Assigned mentor: ${assignedMentor.name}` : 'No mentor assigned yet'}
            </p>
          </div>
          {isLead && (
            <div className="mt-4 pt-4 border-t space-y-2">
              <p className="font-medium">Invite teammate by email</p>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  type="email"
                  placeholder="teammate@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button className="btn btn-primary" onClick={sendTeammateInvite} disabled={sendingInvite}>
                  {sendingInvite ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
              {inviteStatus && <p className="text-sm text-gray-600">{inviteStatus}</p>}
            </div>
          )}
        </div>
      )}

      {!myTeam && invites.length > 0 && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Team Invitations</h3>
          {invites.map((invite: any) => (
            <div key={invite.id} className="flex justify-between border rounded p-3">
              <div>
                <p className="font-semibold">{invite.team?.name}</p>
                <p className="text-sm text-gray-600">
                  Invited by {invite.requestedBy?.name || 'Team lead'}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => acceptInvite(invite.id)}>Accept</button>
                <button className="btn btn-secondary" onClick={() => rejectInvite(invite.id)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {myTeam && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Ghost Slots</h3>
          <div className="flex gap-2">
            <input className="input" value={ghostSkill} onChange={(e) => setGhostSkill(e.target.value)} placeholder="skill_needed" />
            <button className="btn btn-primary" onClick={addGhostSlot}>Create Slot</button>
          </div>
          {ghostSlots.map((slot) => (
            <div key={slot.id} className="flex justify-between border rounded p-2">
              <span>{slot.skillNeeded}</span>
              <div className="flex gap-2">
                <button className="text-indigo-600" onClick={() => setGhostSlots((p) => p.map((s) => s.id === slot.id ? { ...s, filled: !s.filled } : s))}>
                  {slot.filled ? 'Mark Open' : 'Mark Filled'}
                </button>
                <button className="text-red-600" onClick={() => setGhostSlots((p) => p.filter((s) => s.id !== slot.id))}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {myTeam && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Incoming Join Requests (lead)</h3>
          {incoming.map((req) => (
            <div key={req.id} className="flex justify-between border rounded p-2">
              <span>{req.message || 'No message'}</span>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => accept(myTeam.id, req.id)}>Accept</button>
                <button className="btn btn-secondary" onClick={() => reject(myTeam.id, req.id)}>Reject</button>
              </div>
            </div>
          ))}
          {incoming.length === 0 && <p className="text-sm text-gray-600">No incoming requests</p>}
        </div>
      )}

      {myTeam && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Outgoing Requests</h3>
          {outgoing.map((req) => (
            <div key={req.id} className="flex justify-between border rounded p-2">
              <span>{new Date(req.createdAt).toLocaleString()}</span>
              <button className="text-red-600" onClick={() => cancelOutgoing(myTeam.id, req.id)}>Cancel Request</button>
            </div>
          ))}
          {outgoing.length === 0 && <p className="text-sm text-gray-600">No outgoing requests</p>}
        </div>
      )}

      {myTeam && isLead && (
        <div className="card space-y-3">
          <h3 className="font-semibold">Find Teammates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="input"
              placeholder="Search by name, institute, domain"
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
            />
            <input
              className="input"
              placeholder="Invite note (optional)"
              value={inviteNote}
              onChange={(e) => setInviteNote(e.target.value)}
            />
          </div>
          {loadingParticipants ? (
            <p className="text-sm text-gray-600">Loading participants...</p>
          ) : participants.length === 0 ? (
            <p className="text-sm text-gray-600">No available participants found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {participants.map((p: any) => (
                <div key={p.id} className="border rounded p-3">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-gray-600">{p.instituteName}</p>
                  <p className="text-sm text-gray-600">
                    {p.domain} · {p.courseSpecialization}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(p.skills || []).slice(0, 4).map((s: string) => (
                      <span key={s} className="badge badge-primary">{s}</span>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => sendInviteRequest(p.id)}
                    disabled={invitingId === p.id}
                  >
                    {invitingId === p.id ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              ))}
            </div>
          )}
          {inviteStatus && <p className="text-sm text-gray-600">{inviteStatus}</p>}
        </div>
      )}

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Team Discovery</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input" placeholder="Search by team name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <input className="input" placeholder="Filter by skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)} />
        </div>
        <textarea className="input" placeholder="Message for join request" value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTeams.map((t) => {
            const slots: GhostSlot[] = JSON.parse(localStorage.getItem(`ghost-slots:${t.id}`) || '[]');
            return (
              <div key={t.id} className="border rounded p-3">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-gray-600">{t.description || 'No description'}</p>
                <p className="text-sm mt-1">Skills needed: {slots.filter((s) => !s.filled).map((s) => s.skillNeeded).join(', ') || 'N/A'}</p>
                <button className="btn btn-primary mt-2" onClick={() => sendRequest(t.id)} disabled={!isRegistered}>
                  Express Interest
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Top Team Matches</h2>
        {recommendations.map((item) => (
          <div key={item.team.id} className="flex justify-between border rounded p-3">
            <div>
              <p className="font-semibold">{item.team.name}</p>
              <p className="text-sm text-gray-600">Score: {item.score}</p>
            </div>
            <button className="text-sm text-red-600" onClick={() => dismissReco(item.team.id)}>Dismiss</button>
          </div>
        ))}
        {recommendations.length === 0 && <p className="text-sm text-gray-600">No recommendations right now.</p>}
      </div>
    </div>
  );
}
