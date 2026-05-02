'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type Team = {
  id: string;
  name: string;
  description?: string;
  members: Array<{ id: string; role: string; user: { id: string; name: string; image?: string } }>;
  creatorId: string;
  isOpen: boolean;
  maxMembers: number;
  profile?: any;
};

type JoinRequest = {
  id: string;
  userId: string;
  user?: { id: string; name: string; image?: string };
  message?: string;
  createdAt: string;
};

type GhostSlot = { id: string; skillNeeded: string; filled: boolean };

type Participant = {
  id: string;
  name: string;
  image?: string;
  instituteName?: string;
  domain?: string;
  courseSpecialization?: string;
  skills?: string[];
};

type HackathonOption = {
  id: string;
  title: string;
  status?: string;
};

const COMPLEMENTARY_SKILLS: Record<string, string[]> = {
  React: ['UI/UX', 'TypeScript', 'CSS'],
  'Next.js': ['Node.js', 'TypeScript', 'React'],
  Python: ['Machine Learning', 'Data Science', 'AI'],
  'Node.js': ['PostgreSQL', 'Docker', 'MongoDB'],
  TypeScript: ['React', 'Next.js', 'Node.js'],
  'UI/UX': ['Figma', 'CSS', 'React'],
  'Machine Learning': ['Python', 'Data Science', 'TensorFlow'],
  Docker: ['Kubernetes', 'AWS', 'DevOps'],
  PostgreSQL: ['Node.js', 'Prisma', 'SQL'],
  MongoDB: ['Node.js', 'Express', 'Mongoose'],
};

const SKILL_COLORS: Record<string, string> = {
  React: '#61dafb',
  TypeScript: '#3178c6',
  Python: '#3776ab',
  'Node.js': '#339933',
  'Next.js': '#000000',
  'UI/UX': '#ff7262',
  Docker: '#2496ed',
  PostgreSQL: '#4169e1',
  MongoDB: '#47a248',
  'Machine Learning': '#ff6f00',
  'Data Science': '#0066ff',
  CSS: '#264de4',
  JavaScript: '#f7df1e',
  Java: '#007396',
  Go: '#00add8',
  Rust: '#dea584',
};

export default function MyTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialHackathonId = searchParams.get('hackathonId') || '';
  const inviteRequestId = searchParams.get('inviteRequestId') || '';
  const [hackathons, setHackathons] = useState<HackathonOption[]>([]);
  const [hackathonId, setHackathonId] = useState(initialHackathonId);
  const [myUserId, setMyUserId] = useState('');
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
  const [ghostSkill, setGhostSkill] = useState('');
  const [ghostSlots, setGhostSlots] = useState<GhostSlot[]>([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [inviteStatusType, setInviteStatusType] = useState<'success' | 'error'>('success');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [invitingId, setInvitingId] = useState('');
  const [inviteAutoProcessing, setInviteAutoProcessing] = useState(false);
  const [assignedMentor, setAssignedMentor] = useState<{ id: string; name: string; email?: string } | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketPriority, setTicketPriority] = useState('normal');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketFeedback, setTicketFeedback] = useState('');
  const [teamTickets, setTeamTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [activeTab, setActiveTab] = useState<'team' | 'discover' | 'invites' | 'requirements'>('team');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamRequirements, setTeamRequirements] = useState('');
  const [aiTeammateSuggestions, setAiTeammateSuggestions] = useState<any[]>([]);
  const [aiTeamSuggestions, setAiTeamSuggestions] = useState<any[]>([]);
  const [loadingAiSuggestions, setLoadingAiSuggestions] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState('');
  const [teamRequirementsList, setTeamRequirementsList] = useState<any[]>([]);
  const [hackathonRequirements, setHackathonRequirements] = useState<any[]>([]);
  const [scoredRequirements, setScoredRequirements] = useState<any[]>([]);
  const [viewingRequirementId, setViewingRequirementId] = useState<string | null>(null);
  const [requirementInterests, setRequirementInterests] = useState<any[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [newRequirement, setNewRequirement] = useState({ title: '', description: '', skillsNeeded: '' });
  const [expandedRequirementId, setExpandedRequirementId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [viewingParticipant, setViewingParticipant] = useState<any>(null);

  const displayedRequirements = useMemo(() => {
    // Filter out own team's requirements
    const otherTeamsRequirements = hackathonRequirements.filter(req => req.team.id !== myTeam?.id);
    
    if (scoredRequirements.length === 0) return otherTeamsRequirements;
    const scoreMap = new Map(scoredRequirements.map(s => [s.id, s.score]));
    return [...otherTeamsRequirements].sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
  }, [hackathonRequirements, scoredRequirements, myTeam]);

  const scoreMap = useMemo(() => new Map(scoredRequirements.map(s => [s.id, s.score])), [scoredRequirements]);

  const isLead = myTeam && myTeam.members.some((m) => m.user.id === myUserId && m.role === 'leader');

  useEffect(() => {
    async function boot() {
      setBootLoading(true);
      try {
        const [myTeamRes, pRes] = await Promise.all([
          fetch('/api/users/my-team'),
          fetch('/api/users/profile'),
        ]);
        const myTeamData = await myTeamRes.json();
        const pData = await pRes.json();
        const memberships = Array.isArray(myTeamData?.data) ? myTeamData.data : [];
        const uniqueHackathons = memberships.reduce((acc: HackathonOption[], item: any) => {
          if (!acc.some((existing) => existing.id === item.hackathonId)) {
            acc.push({
              id: item.hackathonId,
              title: item.hackathonTitle,
              status: item.hackathonStatus,
            });
          }
          return acc;
        }, []);

        setHackathons(uniqueHackathons);
        setMySkills(pData?.user?.profile?.skills || []);
        setMyUserId(pData?.user?.id || '');

        if (initialHackathonId) {
          const hasCurrent = uniqueHackathons.some((h) => h.id === initialHackathonId);
          if (!hasCurrent) {
            const hackathonRes = await fetch(`/api/hackathons/${initialHackathonId}`);
            const hackathonData = await hackathonRes.json();
            if (hackathonRes.ok && hackathonData?.data?.id) {
              setHackathons((prev) => {
                if (prev.some((h) => h.id === hackathonData.data.id)) return prev;
                return [
                  ...prev,
                  {
                    id: hackathonData.data.id,
                    title: hackathonData.data.title,
                    status: hackathonData.data.status,
                  },
                ];
              });
            }
          }
          setHackathonId(initialHackathonId);
        } else if (uniqueHackathons[0]?.id) {
          setHackathonId(uniqueHackathons[0].id);
        }
      } finally {
        setBootLoading(false);
      }
    }
    boot();
  }, []);

  useEffect(() => {
    if (!initialHackathonId || initialHackathonId === hackathonId) return;
    setHackathonId(initialHackathonId);
  }, [initialHackathonId, hackathonId]);

  const loadTeams = useCallback(async () => {
    if (!hackathonId || !myUserId) return;
    setTeamLoading(true);
    setError('');
    try {
      const [regRes, tRes] = await Promise.all([
        fetch(`/api/hackathons/${hackathonId}/register`),
        fetch(`/api/hackathons/${hackathonId}/teams`),
      ]);
      const regData = await regRes.json();
      const tData = await tRes.json();
      const registered = !!regData?.data?.registered;
      const allTeams = tData.data || [];
      const mine = allTeams.find((t: Team) => t.members.some((m) => m.user.id === myUserId)) || null;

      setIsRegistered(registered);
      setTeams(allTeams);
      setMyTeam(mine);

      if (mine) {
        const [incomingRes, outgoingRes, mentorRes] = await Promise.all([
          fetch(`/api/teams/${mine.id}/requests?type=incoming`),
          fetch(`/api/teams/${mine.id}/requests?type=outgoing`),
          fetch(`/api/teams/${mine.id}/chat`),
        ]);
        const [incomingData, outgoingData, mentorData] = await Promise.all([
          incomingRes.json(),
          outgoingRes.json(),
          mentorRes.json(),
        ]);

        const stored = localStorage.getItem(`ghost-slots:${mine.id}`);
        const storedRequirements = localStorage.getItem(`team-requirements:${mine.id}`);
        setIncoming(incomingData.data || []);
        setOutgoing(outgoingData.data || []);
        setGhostSlots(stored ? JSON.parse(stored) : []);
        setTeamRequirements(storedRequirements || '');
        setInvites([]);
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
    } finally {
      setTeamLoading(false);
    }
  }, [hackathonId, myUserId]);

  useEffect(() => {
    if (bootLoading) return;
    loadTeams();
  }, [bootLoading, loadTeams]);

  // Fetch team requirements when requirements tab is active
  useEffect(() => {
    if (!myTeam || activeTab !== 'requirements') return;
    async function fetchRequirements() {
      setRequirementsLoading(true);
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/teams/${myTeam.id}/requirements`);
        const data = await res.json();
        if (res.ok) {
          setTeamRequirementsList(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch requirements:', error);
      } finally {
        setRequirementsLoading(false);
      }
    }
    fetchRequirements();
  }, [myTeam, activeTab, hackathonId]);

  // Fetch interests for a requirement
  async function fetchRequirementInterests(requirementId: string) {
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/requirements/${requirementId}/interests`);
      const data = await res.json();
      if (res.ok) {
        setRequirementInterests(data.data || []);
        setViewingRequirementId(requirementId);
      }
    } catch (error) {
      console.error('Failed to fetch interests:', error);
    }
  }

  // Accept interest and add user to team
  async function acceptInterest(requirementId: string, interestId: string) {
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/requirements/${requirementId}/interest`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, status: 'ACCEPTED' }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh the interests list
        await fetchRequirementInterests(requirementId);
        // Also refresh team data to show new member
        await loadTeams();
        alert('Participant added to team successfully!');
      } else {
        alert(data.error || 'Failed to accept interest');
      }
    } catch (error) {
      console.error('Failed to accept interest:', error);
      alert('Network error. Please try again.');
    }
  }

  // Reject interest
  async function rejectInterest(requirementId: string, interestId: string) {
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/requirements/${requirementId}/interest`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, status: 'REJECTED' }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh the interests list
        await fetchRequirementInterests(requirementId);
        alert('Interest rejected.');
      } else {
        alert(data.error || 'Failed to reject interest');
      }
    } catch (error) {
      console.error('Failed to reject interest:', error);
      alert('Network error. Please try again.');
    }
  }

  // Fetch hackathon requirements for Discover tab
  useEffect(() => {
    if (activeTab !== 'discover') return;
    async function fetchHackathonRequirements() {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/requirements`);
        const data = await res.json();
        if (res.ok) {
          setHackathonRequirements(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch hackathon requirements:', error);
      }
    }
    fetchHackathonRequirements();
  }, [activeTab, hackathonId]);

  const loadTickets = useCallback(async () => {
    if (!hackathonId || !myTeam) return;
    setLoadingTickets(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/my-team-tickets`);
      const data = await res.json();
      setTeamTickets(data.data || []);
    } catch {
      setTeamTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  }, [hackathonId, myTeam]);

  useEffect(() => {
    if (myTeam && hackathonId) {
      loadTickets();
    }
  }, [myTeam, hackathonId, loadTickets]);

  useEffect(() => {
    async function autoAcceptInvite() {
      if (!inviteRequestId || inviteAutoProcessing || myTeam) return;
      setInviteAutoProcessing(true);
      try {
        const res = await fetch(`/api/teams/invites/${inviteRequestId}`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setInviteStatus(data.error || 'Failed to accept invite');
          setInviteStatusType('error');
        } else {
          setInviteStatus('Invitation accepted. You have been added to the team.');
          setInviteStatusType('success');
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

  function handleHackathonChange(nextHackathonId: string) {
    setHackathonId(nextHackathonId);
    router.replace(`/participant/my-team?hackathonId=${nextHackathonId}`, { scroll: false });
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
      if (t.id === myTeam?.id) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (skillFilter) {
        const slots: GhostSlot[] = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`ghost-slots:${t.id}`) || '[]') : [];
        const hasSkill = slots.some((s) => s.skillNeeded.toLowerCase().includes(skillFilter.toLowerCase()) && !s.filled);
        if (!hasSkill) return false;
      }
      return true;
    });
  }, [teams, search, skillFilter, myTeam]);

  const recommendations = useMemo(() => {
    const scored = teams
      .filter((t) => !myTeam || t.id !== myTeam.id)
      .map((team) => {
        const slots: GhostSlot[] = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`ghost-slots:${team.id}`) || '[]') : [];
        let score = 0;
        for (const slot of slots.filter((s) => !s.filled)) {
          if (mySkills.some((s) => s.toLowerCase() === slot.skillNeeded.toLowerCase())) score += 3;
          else {
            for (const skill of mySkills) {
              if ((COMPLEMENTARY_SKILLS[skill] || []).includes(slot.skillNeeded)) score += 1;
            }
          }
        }
        // Bonus for teams with fewer members (more likely to need help)
        const memberCount = team.members?.length || 0;
        if (memberCount < team.maxMembers) score += (team.maxMembers - memberCount);
        return { team, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const dismissed = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('dismissed-reco') || '[]') as string[] : [];
    return scored.filter((x) => !dismissed.includes(x.team.id));
  }, [teams, mySkills, myTeam]);

  const suggestedTeammates = useMemo(() => {
    if (!myTeam || !isLead) return [];
    
    const neededSkills: string[] = ghostSlots
      .filter((s) => !s.filled)
      .map((s) => s.skillNeeded);
    
    // Also look at complementary skills based on current team skills
    const teamSkills = myTeam.members.flatMap((m) => {
      const p = participants.find((p) => p.id === m.user.id);
      return p?.skills || [];
    });
    
    const complementaryNeeds = new Set<string>();
    teamSkills.forEach((skill) => {
      (COMPLEMENTARY_SKILLS[skill] || []).forEach((comp) => {
        if (!teamSkills.includes(comp)) {
          complementaryNeeds.add(comp);
        }
      });
    });
    
    const allNeeds = [...neededSkills, ...Array.from(complementaryNeeds)];
    
    return participants
      .filter((p) => !myTeam.members.some((m) => m.user.id === p.id))
      .map((p) => {
        let matchScore = 0;
        const pSkills = p.skills || [];
        
        // Direct skill match
        for (const need of allNeeds) {
          if (pSkills.some((s) => s.toLowerCase() === need.toLowerCase())) {
            matchScore += 3;
          }
        }
        
        // Complementary skill match
        for (const skill of pSkills) {
          if ((COMPLEMENTARY_SKILLS[skill] || []).some((c) => allNeeds.includes(c))) {
            matchScore += 1;
          }
        }
        
        return { participant: p, score: matchScore };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [myTeam, isLead, ghostSlots, participants]);

  async function createTeam() {
    if (!teamName.trim() || teamName.trim().length < 2) return;
    const res = await fetch(`/api/hackathons/${hackathonId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: teamName, description: teamDesc, maxMembers: 5 }),
    });
    if (res.ok) {
      await loadTeams();
      setTeamName('');
      setTeamDesc('');
    }
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
        setInviteStatusType('error');
        return;
      }
      setInviteStatus('Invitation email sent successfully!');
      setInviteStatusType('success');
      setInviteEmail('');
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteStatus('');
      }, 2000);
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
        setInviteStatusType('error');
        return;
      }
      setInviteStatus('Invite sent!');
      setInviteStatusType('success');
      setInviteNote('');
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

  async function submitMentorTicket() {
    if (!hackathonId || !ticketTitle.trim() || !ticketDesc.trim()) return;
    setTicketSubmitting(true);
    setTicketFeedback('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticketTitle.trim(),
          description: ticketDesc.trim(),
          category: ticketCategory,
          priority: ticketPriority,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicketFeedback('Help request sent! A mentor will be assigned soon.');
        setTicketTitle('');
        setTicketDesc('');
        setShowTicketForm(false);
        await loadTickets();
      } else {
        setTicketFeedback(data.error || 'Failed to send request');
      }
    } catch {
      setTicketFeedback('Network error. Please try again.');
    } finally {
      setTicketSubmitting(false);
    }
  }

  function addGhostSlot() {
    if (!ghostSkill.trim() || !myTeam) return;
    setGhostSlots((prev) => [...prev, { id: crypto.randomUUID(), skillNeeded: ghostSkill.trim(), filled: false }]);
    setGhostSkill('');
  }

  function removeGhostSlot(id: string) {
    setGhostSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function toggleGhostSlot(id: string) {
    setGhostSlots((prev) => prev.map((s) => s.id === id ? { ...s, filled: !s.filled } : s));
  }

  function dismissReco(teamId: string) {
    const dismissed = JSON.parse(localStorage.getItem('dismissed-reco') || '[]') as string[];
    localStorage.setItem('dismissed-reco', JSON.stringify([...dismissed, teamId]));
    loadTeams();
  }

  async function getAiTeammateSuggestions() {
    if (!myTeam || !hackathonId) return;
    setLoadingAiSuggestions(true);
    setAiSuggestionError('');
    try {
      const unfilledGhostSlots = ghostSlots.filter(s => !s.filled).map(s => s.skillNeeded);
      const res = await fetch(`/api/hackathons/${hackathonId}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'teammates', 
          teamId: myTeam.id,
          ghostSlots: unfilledGhostSlots,
          teamRequirements: teamRequirements,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiTeammateSuggestions(data.data || []);
      } else {
        setAiSuggestionError(data.error || 'Failed to get suggestions');
      }
    } catch {
      setAiSuggestionError('Network error');
    } finally {
      setLoadingAiSuggestions(false);
    }
  }

  async function getAiTeamSuggestions() {
    if (!hackathonId) return;
    setLoadingAiSuggestions(true);
    setAiSuggestionError('');
    try {
      // Filter out own team's requirements
      const otherTeamsRequirements = hackathonRequirements.filter(req => req.team.id !== myTeam?.id);
      
      // Compute scores locally based on skill match
      const scores = otherTeamsRequirements.map(req => {
        const reqSkills = req.skillsNeeded || [];
        let score = 0;
        // Skill matches
        for (const skill of mySkills) {
          if (reqSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
            score += 15;
          }
        }
        // Team size bonus (smaller teams have more openings)
        const teamSize = req.team._count?.members || 0;
        const maxMembers = req.team.maxMembers || 5;
        const openSlots = maxMembers - teamSize;
        score += openSlots * 2;
        return { id: req.id, score };
      });
      setScoredRequirements(scores);
      setAiTeamSuggestions([]); // Clear any previous AI team suggestions
    } catch (error) {
      setAiSuggestionError('Failed to compute scores');
    } finally {
      setLoadingAiSuggestions(false);
    }
  }

  async function saveTeamRequirements() {
    // This would need an API endpoint to save team requirements
    // For now, we'll store in localStorage
    if (myTeam) {
      localStorage.setItem(`team-requirements:${myTeam.id}`, teamRequirements);
    }
  }

  async function createRequirement() {
    if (!myTeam || !newRequirement.title.trim()) return;
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/teams/${myTeam.id}/requirements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newRequirement.title,
          description: newRequirement.description,
          skillsNeeded: newRequirement.skillsNeeded.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewRequirement({ title: '', description: '', skillsNeeded: '' });
        // Refresh requirements list
        const res2 = await fetch(`/api/hackathons/${hackathonId}/teams/${myTeam.id}/requirements`);
        const data2 = await res2.json();
        if (res2.ok) {
          setTeamRequirementsList(data2.data || []);
        }
      } else {
        alert(data.error || 'Failed to create requirement');
      }
    } catch (error) {
      console.error('Create requirement error:', error);
    }
  }

  async function toggleRequirementStatus(requirementId: string, newStatus: boolean) {
    if (!myTeam) return;
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/teams/${myTeam.id}/requirements`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementId,
          isActive: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh requirements list
        const res2 = await fetch(`/api/hackathons/${hackathonId}/teams/${myTeam.id}/requirements`);
        const data2 = await res2.json();
        if (res2.ok) {
          setTeamRequirementsList(data2.data || []);
        }
        alert(newStatus ? 'Requirement activated' : 'Requirement marked as filled and removed from list');
      } else {
        alert(data.error || 'Failed to update requirement');
      }
    } catch (error) {
      console.error('Toggle requirement error:', error);
    }
  }

  async function expressInterest(requirementId: string, message: string) {
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/requirements/${requirementId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        // Refresh hackathon requirements to update interest status
        const res2 = await fetch(`/api/hackathons/${hackathonId}/requirements`);
        const data2 = await res2.json();
        if (res2.ok) {
          setHackathonRequirements(data2.data || []);
        }
      } else {
        alert(data.error || 'Failed to express interest');
      }
    } catch (error) {
      console.error('Express interest error:', error);
    }
  }

  function getSkillColor(skill: string): string {
    return SKILL_COLORS[skill] || '#888';
  }

  const currentHackathon = hackathons.find((h) => h.id === hackathonId);

  if (bootLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
        <div style={{ width: 28, height: 28, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!hackathonId) {
    return (
      <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No hackathon selected</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Open team page from specific hackathon card, or join a hackathon first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>
            Team Management
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            My Team
          </h1>
          {currentHackathon && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {currentHackathon.title}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="org-input"
            value={hackathonId}
            onChange={(e) => handleHackathonChange(e.target.value)}
            style={{ width: 200 }}
          >
            {!hackathons.length && <option value="">Select hackathon</option>}
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>
      </div>

      {teamLoading && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 16, height: 16, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>Loading team data...</p>
        </div>
      )}

      {/* Auto-processing invite */}
      {inviteAutoProcessing && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Processing team invitation...</p>
        </div>
      )}

      {/* Status Messages */}
      {inviteStatus && (
        <div style={{
          background: inviteStatusType === 'success' ? 'rgba(62, 207, 142, 0.1)' : 'var(--error-dim)',
          border: `1px solid ${inviteStatusType === 'success' ? 'var(--success)' : 'var(--error)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          color: inviteStatusType === 'success' ? 'var(--success)' : 'var(--error)',
          fontSize: '0.85rem',
        }}>
          {inviteStatus}
        </div>
      )}

      {/* Not Registered */}
      {!isRegistered && hackathonId && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Register for this hackathon first</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              You need registration before creating or joining teams.
            </p>
            {error && <p style={{ fontSize: '0.82rem', color: 'var(--error)', marginTop: '0.25rem' }}>{error}</p>}
          </div>
          <button className="org-btn-primary" onClick={goToRegistration} disabled={registering}>
            Register Now
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--border-default)', paddingBottom: '0.6rem', marginBottom: '1.25rem' }}>
        {[
          { key: 'team', label: 'My Team', count: myTeam ? myTeam.members.length : 0 },
          { key: 'discover', label: 'Discover Teams', count: filteredTeams.length },
          { key: 'invites', label: 'Invitations', count: invites.length + incoming.length },
          ...(isLead ? [{ key: 'requirements', label: 'Requirements', count: 0 }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 999,
              border: '1px solid',
              borderColor: activeTab === tab.key ? 'var(--accent)' : 'var(--border-default)',
              background: activeTab === tab.key ? 'var(--accent)' : 'var(--bg-raised)',
              color: activeTab === tab.key ? 'var(--text-inverse)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              fontWeight: activeTab === tab.key ? 700 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.key ? 'var(--text-inverse)' : 'var(--accent-dim)',
                color: activeTab === tab.key ? 'var(--accent)' : 'var(--accent)',
                padding: '0.1rem 0.4rem',
                borderRadius: 999,
                fontSize: '0.6rem',
                fontWeight: 600,
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'team' && (
        <div style={{ display: 'grid', gridTemplateColumns: myTeam ? '1fr 320px' : '1fr', gap: '1rem' }}>
          {/* Main Team Content */}
          <div>
            {!myTeam ? (
              /* Create Team Form */
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Create Your Team</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Start a new team and invite teammates</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Team Name</label>
                    <input
                      className="org-input"
                      placeholder="Enter team name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Description (optional)</label>
                    <textarea
                      className="org-input"
                      placeholder="Describe your team's focus or goals..."
                      value={teamDesc}
                      onChange={(e) => setTeamDesc(e.target.value)}
                      style={{ minHeight: 80, resize: 'vertical' as const }}
                    />
                  </div>
                  <button
                    className="org-btn-primary"
                    onClick={createTeam}
                    disabled={!isRegistered || !teamName.trim() || teamName.trim().length < 2}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Create Team
                  </button>
                </div>
              </div>
            ) : (
              /* Existing Team View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Team Header Card */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 0% 100%, var(--accent-dim), transparent)', pointerEvents: 'none' }} />
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {myTeam.name}
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {myTeam.description || 'No description'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span className="org-badge org-badge-accent">{myTeam.members.length}/{myTeam.maxMembers}</span>
                        {myTeam.isOpen && <span className="org-badge org-badge-success">Open</span>}
                      </div>
                    </div>

                    {/* Team Members */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {myTeam.members.map((m) => (
                        <div key={m.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.4rem 0.75rem',
                          background: m.role === 'leader' ? 'var(--accent-dim)' : 'var(--bg-raised)',
                          border: `1px solid ${m.role === 'leader' ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                        }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: m.role === 'leader' ? 'var(--accent)' : 'var(--bg-elevated)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 600,
                            color: m.role === 'leader' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                          }}>
                            {m.user.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {m.user.name}
                            </p>
                            <p style={{ fontSize: '0.65rem', color: m.role === 'leader' ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {m.role === 'leader' ? 'Lead' : 'Member'}
                            </p>
                          </div>
                          {isLead && m.role !== 'leader' && (
                            <button
                              onClick={() => removeMember(m.id)}
                              style={{
                                marginLeft: '0.25rem', padding: '0.2rem',
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                color: 'var(--error)', fontSize: '0.7rem',
                              }}
                              title="Remove member"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ghost Slots */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Skills Needed</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Define what skills your team is looking for</p>
                    </div>
                    <span className="org-badge org-badge-muted">{ghostSlots.filter((s) => !s.filled).length} open</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <input
                      className="org-input"
                      placeholder="e.g., React, Python, UI/UX..."
                      value={ghostSkill}
                      onChange={(e) => setGhostSkill(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addGhostSlot()}
                      style={{ flex: 1 }}
                    />
                    <button className="org-btn-primary" onClick={addGhostSlot} disabled={!ghostSkill.trim()}>
                      Add Skill
                    </button>
                  </div>

                  {ghostSlots.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {ghostSlots.map((slot) => (
                        <div key={slot.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.3rem 0.6rem',
                          background: slot.filled ? 'rgba(62, 207, 142, 0.1)' : 'var(--bg-raised)',
                          border: `1px solid ${slot.filled ? 'var(--success)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-md)',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: slot.filled ? 'var(--success)' : getSkillColor(slot.skillNeeded),
                          }} />
                          <span style={{
                            fontSize: '0.75rem',
                            color: slot.filled ? 'var(--success)' : 'var(--text-primary)',
                            textDecoration: slot.filled ? 'line-through' : 'none',
                          }}>{slot.skillNeeded}</span>
                          <button onClick={() => toggleGhostSlot(slot.id)} style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', fontSize: '0.65rem', padding: '0.1rem',
                          }}>
                            {slot.filled ? '↩' : '✓'}
                          </button>
                          <button onClick={() => removeGhostSlot(slot.id)} style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--error)', fontSize: '0.65rem', padding: '0.1rem',
                          }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Team Requirements */}
                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      Team Requirements (what kind of teammates are you looking for?)
                    </label>
                    <textarea
                      className="org-input"
                      placeholder="e.g., Looking for someone with frontend experience, preferably with React and TypeScript. Must be available for 2-day hackathon..."
                      value={teamRequirements}
                      onChange={(e) => setTeamRequirements(e.target.value)}
                      onBlur={saveTeamRequirements}
                      style={{ minHeight: 60, resize: 'vertical' as const, fontSize: '0.78rem' }}
                    />
                  </div>

                  {/* AI Suggestions Button */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      className="org-btn-primary"
                      onClick={getAiTeammateSuggestions}
                      disabled={loadingAiSuggestions}
                      style={{ width: '100%', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      {loadingAiSuggestions ? (
                        <>
                          <div style={{ width: 14, height: 14, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                          Finding matches...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          AI Suggest Teammates
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Teammate Suggestions */}
                {aiTeammateSuggestions.length > 0 && (
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)' }}>
                        AI Suggested Teammates
                      </p>
                      <button onClick={() => setAiTeammateSuggestions([])} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        Clear
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aiTeammateSuggestions.map((suggestion) => (
                        <div key={suggestion.id} style={{
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.75rem',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: 'var(--accent-dim)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600,
                              color: 'var(--accent)',
                            }}>
                              {suggestion.participant?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {suggestion.participant?.name}
                              </p>
                              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                Match Score: {suggestion.score}%
                              </p>
                            </div>
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                            {'"'}{suggestion.reason}{'"'}
                          </p>
                          {suggestion.participant?.skills && suggestion.participant.skills.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                              {suggestion.participant.skills.slice(0, 5).map((s: string) => (
                                <span key={s} style={{
                                  padding: '0.15rem 0.4rem',
                                  background: `${getSkillColor(s)}20`,
                                  border: `1px solid ${getSkillColor(s)}40`,
                                  borderRadius: '999px',
                                  fontSize: '0.6rem',
                                  color: getSkillColor(s),
                                }}>{s}</span>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="org-btn-primary"
                              onClick={() => setViewingParticipant(suggestion.participant)}
                              style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
                            >
                              View Details
                            </button>
                            <button
                              className="org-btn-primary"
                              onClick={() => sendInviteRequest(suggestion.id)}
                              disabled={invitingId === suggestion.id}
                              style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
                            >
                              {invitingId === suggestion.id ? 'Sending...' : 'Send Invite'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mentor Help */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mentor Support</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {assignedMentor ? `Assigned: ${assignedMentor.name}` : 'No mentor assigned yet'}
                      </p>
                    </div>
                    {assignedMentor && (
                      <Link
                        href={`/participant/my-team/mentor-chat?teamId=${myTeam.id}&hackathonId=${hackathonId}`}
                        className="org-btn-primary"
                        style={{ textDecoration: 'none', fontSize: '0.78rem' }}
                      >
                        Chat with Mentor
                      </Link>
                    )}
                  </div>

                  {/* Help Ticket Form */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Need help? Request a mentor</p>
                      <button
                        onClick={() => setShowTicketForm(!showTicketForm)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 500,
                        }}
                      >
                        {showTicketForm ? 'Cancel' : '+ New Request'}
                      </button>
                    </div>

                    {ticketFeedback && (
                      <div style={{
                        background: ticketFeedback.includes('sent') ? 'rgba(62, 207, 142, 0.1)' : 'var(--error-dim)',
                        border: `1px solid ${ticketFeedback.includes('sent') ? 'var(--success)' : 'var(--error)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '0.6rem 0.75rem',
                        marginBottom: '0.75rem',
                        fontSize: '0.78rem',
                        color: ticketFeedback.includes('sent') ? 'var(--success)' : 'var(--error)',
                      }}>
                        {ticketFeedback}
                      </div>
                    )}

                    {showTicketForm && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                        <input
                          className="org-input"
                          placeholder="What do you need help with?"
                          value={ticketTitle}
                          onChange={(e) => setTicketTitle(e.target.value)}
                        />
                        <textarea
                          className="org-input"
                          placeholder="Describe your problem in detail..."
                          value={ticketDesc}
                          onChange={(e) => setTicketDesc(e.target.value)}
                          style={{ minHeight: 80, resize: 'vertical' as const }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Category</label>
                            <select className="org-input" value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value)}>
                              <option value="technical">Technical</option>
                              <option value="general">General</option>
                              <option value="judging">Judging</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Priority</label>
                            <select className="org-input" value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>
                              <option value="low">Low</option>
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                        <button
                          className="org-btn-primary"
                          onClick={submitMentorTicket}
                          disabled={ticketSubmitting || !ticketTitle.trim() || !ticketDesc.trim()}
                          style={{ width: '100%' }}
                        >
                          {ticketSubmitting ? 'Sending...' : 'Send Help Request'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Team Help Requests */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Team Help Requests</p>
                      <button
                        onClick={loadTickets}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 500,
                        }}
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingTickets ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                        <div style={{ width: 20, height: 20, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                      </div>
                    ) : teamTickets.length === 0 ? (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                        No help requests yet
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 300, overflowY: 'auto' }}>
                        {teamTickets.map((ticket: any) => {
                          const isResolved = ticket.status === 'RESOLVED';
                          const resolutionMatch = ticket.description.match(/\[Resolution\]\n([\s\S]*)$/);
                          const originalDesc = resolutionMatch ? ticket.description.replace(/\[Resolution\][\s\S]*$/, '').trim() : ticket.description;
                          const resolution = resolutionMatch ? resolutionMatch[1].trim() : '';
                          const timeSince = (dateStr: string) => {
                            const diff = Date.now() - new Date(dateStr).getTime();
                            const mins = Math.floor(diff / 60000);
                            if (mins < 60) return `${mins}m ago`;
                            const hours = Math.floor(mins / 60);
                            if (hours < 24) return `${hours}h ago`;
                            return `${Math.floor(hours / 24)}d ago`;
                          };
                          const priorityColor = ticket.priority === 'high' ? '#ef4444' : ticket.priority === 'low' ? '#64748b' : '#818cf8';
                          const categoryIcon = ticket.category === 'technical' ? '{ }' : ticket.category === 'judging' ? '#' : '?';

                          return (
                            <div key={ticket.id} style={{
                              background: 'var(--bg-raised)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem',
                              borderLeft: `3px solid ${isResolved ? '#3ecf8e' : priorityColor}`,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{categoryIcon}</span>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{ticket.title}</span>
                                </div>
                                <span style={{
                                  fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                                  padding: '0.1rem 0.35rem', borderRadius: 'var(--radius-sm)',
                                  background: isResolved ? 'rgba(62, 207, 142, 0.12)' : 'rgba(129, 140, 248, 0.12)',
                                  color: isResolved ? '#3ecf8e' : '#818cf8',
                                }}>
                                  {isResolved ? 'RESOLVED' : ticket.status}
                                </span>
                              </div>

                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                                {originalDesc.length > 120 ? originalDesc.slice(0, 120) + '...' : originalDesc}
                              </p>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                <span>by {ticket.creator?.name || 'Unknown'}</span>
                                <span>{timeSince(ticket.createdAt)}</span>
                              </div>

                              {ticket.assignedTo && (
                                <div style={{
                                  marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)',
                                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                                }}>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Mentor:</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 500 }}>
                                    {ticket.assignedTo.name || ticket.assignedTo.email}
                                  </span>
                                </div>
                              )}

                              {isResolved && resolution && (
                                <div style={{
                                  marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)',
                                  background: 'rgba(62, 207, 142, 0.06)', borderRadius: 'var(--radius-sm)', padding: '0.5rem',
                                }}>
                                  <p style={{ fontSize: '0.65rem', color: '#3ecf8e', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Mentor Suggestion
                                  </p>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                    {resolution}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="org-btn-secondary" onClick={leaveTeam}>Leave Team</button>
                  {isLead && (
                    <button className="org-btn-primary" onClick={() => setShowInviteModal(true)}>
                      Invite Teammate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Suggestions & Requests */}
          {myTeam && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Suggested Teammates */}
              {isLead && suggestedTeammates.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                    Suggested Teammates
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {suggestedTeammates.map(({ participant: p, score }) => (
                      <div key={p.id} style={{
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--bg-elevated)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 600,
                            color: 'var(--text-secondary)',
                          }}>
                            {p.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</p>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.instituteName || 'Unknown'}</p>
                          </div>
                          <span className="org-badge org-badge-accent" style={{ fontSize: '0.6rem' }}>{score} pts</span>
                        </div>
                        {p.skills && p.skills.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                            {p.skills.slice(0, 4).map((s) => (
                              <span key={s} style={{
                                padding: '0.15rem 0.4rem',
                                background: `${getSkillColor(s)}20`,
                                border: `1px solid ${getSkillColor(s)}40`,
                                borderRadius: '999px',
                                fontSize: '0.6rem',
                                color: getSkillColor(s),
                              }}>{s}</span>
                            ))}
                          </div>
                        )}
                        <button
                          className="org-btn-primary"
                          onClick={() => sendInviteRequest(p.id)}
                          disabled={invitingId === p.id}
                          style={{ width: '100%', fontSize: '0.75rem', padding: '0.4rem' }}
                        >
                          {invitingId === p.id ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incoming Requests */}
              {incoming.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                    Join Requests ({incoming.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {incoming.map((req) => (
                      <div key={req.id} style={{
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem',
                      }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {req.user?.name || 'Unknown user'}
                        </p>
                        {req.message && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                            {'"'}{req.message}{'"'}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="org-btn-primary" onClick={() => accept(myTeam!.id, req.id)} style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem' }}>
                            Accept
                          </button>
                          <button className="org-btn-secondary" onClick={() => reject(myTeam!.id, req.id)} style={{ flex: 1, fontSize: '0.72rem', padding: '0.35rem' }}>
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outgoing Requests */}
              {outgoing.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
                    Pending ({outgoing.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {outgoing.map((req) => (
                      <div key={req.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.5rem 0.75rem',
                        background: 'var(--bg-raised)',
                        borderRadius: 'var(--radius-md)',
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => cancelOutgoing(myTeam!.id, req.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '0.72rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Hackathon Requirements */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Team Requirements ({displayedRequirements.length})
            </h3>
            {displayedRequirements.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No active requirements posted.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {displayedRequirements.map((req) => (
                  <div key={req.id} style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{req.title}</h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          Team: {req.team.name} ({req.team._count?.members || 0}/{req.team.maxMembers || 5})
                          {scoreMap.has(req.id) && (
                            <span style={{ fontSize: '0.6rem', background: 'var(--accent)', color: 'var(--text-inverse)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                              {scoreMap.get(req.id)}%
                            </span>
                          )}
                        </p>
                        {/* Team members list */}
                        {req.team.members && req.team.members.length > 0 && (
                          <div style={{ marginTop: '0.5rem' }}>
                            {expandedRequirementId === req.id ? (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                  <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Members:</p>
                                  <button
                                    onClick={() => setExpandedRequirementId(null)}
                                    style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                  >
                                    Hide Members
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {req.team.members.map((member) => (
                                    <div key={member.user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {member.user.image && (
                                          <Image 
                                            src={member.user.image} 
                                            alt={member.user.name}
                                            width={20}
                                            height={20}
                                            style={{ borderRadius: '50%' }}
                                          />
                                        )}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{member.user.name}</span>
                                      </div>
                                      <button
                                        onClick={() => { setSelectedMember(member); setSelectedRequirement(req); }}
                                        style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                      >
                                        View Details
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <button
                                onClick={() => setExpandedRequirementId(req.id)}
                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                              >
                                <span>View Members ({req.team._count?.members || 0})</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      {req.userInterestStatus ? (
                        <span style={{
                          fontSize: '0.6rem',
                          background: req.userInterestStatus === 'PENDING' ? 'var(--warning-dim)' : req.userInterestStatus === 'ACCEPTED' ? 'var(--success-dim)' : 'var(--error-dim)',
                          color: req.userInterestStatus === 'PENDING' ? 'var(--warning)' : req.userInterestStatus === 'ACCEPTED' ? 'var(--success)' : 'var(--error)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '999px',
                        }}>
                          {req.userInterestStatus}
                        </span>
                      ) : (
                        <button
                          className="org-btn-primary"
                          onClick={() => expressInterest(req.id, '')}
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                        >
                          Interested
                        </button>
                      )}
                    </div>
                    {req.description && <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{req.description}</p>}
                    {req.skillsNeeded && req.skillsNeeded.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                        {req.skillsNeeded.slice(0, 4).map((skill: string) => (
                          <span key={skill} style={{
                            padding: '0.1rem 0.3rem',
                            background: `${getSkillColor(skill)}20`,
                            border: `1px solid ${getSkillColor(skill)}40`,
                            borderRadius: '999px',
                            fontSize: '0.55rem',
                            color: getSkillColor(skill),
                          }}>{skill}</span>
                        ))}
                        {req.skillsNeeded.length > 4 && (
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>+{req.skillsNeeded.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Team Suggestions */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
            <button
              className="org-btn-primary"
              onClick={getAiTeamSuggestions}
              disabled={loadingAiSuggestions || !isRegistered}
              style={{ width: '100%', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loadingAiSuggestions ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'auth-spin 0.7s linear infinite' }} />
                  AI analyzing requirements...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  AI Find Best Teams for Me
                </>
              )}
            </button>
            {!isRegistered && (
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                Register for this hackathon to get AI suggestions
              </p>
            )}
          </div>

          {/* AI Error Message */}
          {aiSuggestionError && (
            <div style={{
              background: 'var(--error-dim)',
              border: '1px solid var(--error)',
              borderRadius: 'var(--radius-md)',
              padding: '0.6rem 0.75rem',
              fontSize: '0.82rem',
              color: 'var(--error)',
            }}>
              {aiSuggestionError}
            </div>
          )}

          {/* AI Team Suggestions */}
          {aiTeamSuggestions.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)' }}>
                  AI Recommended Teams for You
                </p>
                <button onClick={() => setAiTeamSuggestions([])} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  Clear
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {aiTeamSuggestions.map((suggestion) => (
                  <div key={suggestion.id} style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.4rem 0.6rem', background: 'var(--accent)', borderRadius: '0 0 0 var(--radius-md)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-inverse)' }}>
                      {suggestion.score}% Match
                    </div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {suggestion.team?.name}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      {suggestion.team?.description || 'No description'}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                        {'"'}{suggestion.reason}{'"'}
                    </p>
                    {suggestion.team?.skills && suggestion.team.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                        {suggestion.team.skills.slice(0, 4).map((s: string) => (
                          <span key={s} style={{
                            padding: '0.15rem 0.4rem',
                            background: `${getSkillColor(s)}20`,
                            border: `1px solid ${getSkillColor(s)}40`,
                            borderRadius: '999px',
                            fontSize: '0.6rem',
                            color: getSkillColor(s),
                          }}>{s}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {suggestion.team?.members?.length || 0}/{suggestion.team?.maxMembers || 5} members
                      </span>
                      <button className="org-btn-primary" onClick={() => sendRequest(suggestion.id)} disabled={!isRegistered} style={{ fontSize: '0.75rem' }}>
                        Express Interest
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}




        </div>
      )}

      {/* Invites Tab */}
      {activeTab === 'invites' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Team Invitations */}
          {invites.length > 0 ? (
            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.75rem' }}>
                Pending Invitations ({invites.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {invites.map((invite: any) => (
                  <div key={invite.id} style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-accent)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {invite.team?.name}
                        </p>
                        {invite.team?.description && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {invite.team.description}
                          </p>
                        )}
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          Invited by {invite.requestedBy?.name || 'Team lead'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="org-btn-primary" onClick={() => acceptInvite(invite.id)}>
                          Accept
                        </button>
                        <button className="org-btn-secondary" onClick={() => rejectInvite(invite.id)}>
                          Decline
                        </button>
                      </div>
                    </div>
                    
                    {/* Team Details */}
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                        Team Members ({invite.team?.members?.length || 0}/{invite.team?.maxMembers || 5})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {invite.team?.members?.map((member: any) => (
                          <div key={member.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: 'var(--bg-raised)',
                            borderRadius: 'var(--radius-md)',
                          }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'var(--accent-dim)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontFamily: 'var(--font-display)',
                              fontSize: '1rem',
                              fontWeight: 600,
                              color: 'var(--accent)',
                            }}>
                              {member.user?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {member.user?.name}
                                {member.role === 'leader' && (
                                  <span style={{ marginLeft: '0.5rem', fontSize: '0.65rem', background: 'var(--accent)', color: 'var(--text-inverse)', padding: '0.1rem 0.4rem', borderRadius: '999px', verticalAlign: 'middle' }}>
                                    LEAD
                                  </span>
                                )}
                              </p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {member.user?.profile?.experience || 'No experience listed'}
                              </p>
                              {member.user?.profile?.skills && member.user.profile.skills.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                                  {member.user.profile.skills.slice(0, 4).map((skill: string) => (
                                    <span key={skill} style={{
                                      padding: '0.1rem 0.4rem',
                                      background: `${getSkillColor(skill)}20`,
                                      border: `1px solid ${getSkillColor(skill)}40`,
                                      borderRadius: '999px',
                                      fontSize: '0.6rem',
                                      color: getSkillColor(skill),
                                    }}>{skill}</span>
                                  ))}
                                  {member.user.profile.skills.length > 4 && (
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                      +{member.user.profile.skills.length - 4} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending invitations</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Team invites will appear here
              </p>
            </div>
          )}
        </div>
      )}

      {/* Requirements Tab */}
      {activeTab === 'requirements' && isLead && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Create Requirement Form */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Post Team Requirements
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Title *
                </label>
                <input
                  className="org-input"
                  value={newRequirement.title}
                  onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                  placeholder="e.g., Looking for a frontend developer"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Description
                </label>
                <textarea
                  className="org-input"
                  value={newRequirement.description}
                  onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                  placeholder="Describe what you're looking for..."
                  style={{ minHeight: 80, resize: 'vertical' as const }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Skills Needed (comma separated)
                </label>
                <input
                  className="org-input"
                  value={newRequirement.skillsNeeded}
                  onChange={(e) => setNewRequirement({ ...newRequirement, skillsNeeded: e.target.value })}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
              <button
                className="org-btn-primary"
                onClick={createRequirement}
                disabled={!newRequirement.title.trim()}
                style={{ alignSelf: 'flex-start' }}
              >
                Post Requirement
              </button>
            </div>
          </div>
          
          {/* Existing Requirements */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Your Team&apos;s Requirements ({teamRequirementsList.filter((r: any) => r.isActive).length})
            </h3>
            {requirementsLoading ? (
              <p>Loading...</p>
            ) : teamRequirementsList.filter((r: any) => r.isActive).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No active requirements posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {teamRequirementsList.filter((r: any) => r.isActive).map((req) => (
                  <div key={req.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{req.title}</h4>
                        {req.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{req.description}</p>}
                      </div>
                    </div>
                    {req.skillsNeeded && req.skillsNeeded.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.75rem' }}>
                        {req.skillsNeeded.map((skill: string) => (
                          <span key={skill} style={{
                            padding: '0.15rem 0.4rem',
                            background: `${getSkillColor(skill)}20`,
                            border: `1px solid ${getSkillColor(skill)}40`,
                            borderRadius: '999px',
                            fontSize: '0.6rem',
                            color: getSkillColor(skill),
                          }}>{skill}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {req._count?.interests || 0} interested participants
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="org-btn-secondary" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }} onClick={() => {
                          if (viewingRequirementId === req.id) {
                            setViewingRequirementId(null);
                            setRequirementInterests([]);
                          } else {
                            fetchRequirementInterests(req.id);
                          }
                        }}>
                          {viewingRequirementId === req.id ? 'Hide Interests' : 'View Interests'}
                        </button>
                        <button 
                          className="org-btn-secondary" 
                          style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', color: 'var(--error)' }} 
                          onClick={() => toggleRequirementStatus(req.id, false)}
                        >
                          Mark as Filled
                        </button>
                      </div>
                    </div>
                    {viewingRequirementId === req.id && (
                      <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Interested Participants:</p>
                        {requirementInterests.length === 0 ? (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No interested participants yet.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {requirementInterests.map((interest) => (
                              <div key={interest.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  {interest.user.image && (
                                    <Image 
                                      src={interest.user.image} 
                                      alt={interest.user.name}
                                      width={24}
                                      height={24}
                                      style={{ borderRadius: '50%' }}
                                    />
                                  )}
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>{interest.user.name}</span>
                                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({interest.status})</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  {interest.status === 'PENDING' && (
                                    <>
                                      <button 
                                        className="org-btn-primary" 
                                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }} 
                                        onClick={() => acceptInterest(req.id, interest.id)}
                                      >
                                        Accept
                                      </button>
                                      <button 
                                        className="org-btn-secondary" 
                                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', color: 'var(--error)' }} 
                                        onClick={() => rejectInterest(req.id, interest.id)}
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  <button className="org-btn-secondary" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }} onClick={() => { setSelectedMember(interest); setSelectedRequirement(req); }}>
                                    View Details
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Invite Teammate
              </h3>
              <button
                onClick={() => { setShowInviteModal(false); setInviteStatus(''); setInviteEmail(''); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Send an email invitation to your teammate. They must have a Hackmate account to accept.
            </p>

            {inviteStatus && (
              <div style={{
                background: inviteStatusType === 'success' ? 'rgba(62, 207, 142, 0.1)' : 'var(--error-dim)',
                border: `1px solid ${inviteStatusType === 'success' ? 'var(--success)' : 'var(--error)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 0.75rem',
                marginBottom: '1rem',
                fontSize: '0.82rem',
                color: inviteStatusType === 'success' ? 'var(--success)' : 'var(--error)',
              }}>
                {inviteStatus}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <input
                  className="org-input"
                  type="email"
                  placeholder="teammate@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTeammateInvite()}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  className="org-btn-secondary"
                  onClick={() => { setShowInviteModal(false); setInviteStatus(''); setInviteEmail(''); }}
                >
                  Cancel
                </button>
                <button
                  className="org-btn-primary"
                  onClick={sendTeammateInvite}
                  disabled={sendingInvite || !inviteEmail.trim()}
                >
                  {sendingInvite ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Member Details Modal */}
      {selectedMember && selectedRequirement && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => { setSelectedMember(null); setSelectedRequirement(null); }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Member Details
              </h3>
              <button
                onClick={() => { setSelectedMember(null); setSelectedRequirement(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {selectedMember.user.image && (
                  <Image 
                    src={selectedMember.user.image} 
                    alt={selectedMember.user.name}
                    width={64}
                    height={64}
                    style={{ borderRadius: '50%' }}
                  />
                )}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{selectedMember.user.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {selectedMember.user.id}</p>
                </div>
              </div>
              {selectedMember.user.profile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedMember.user.profile.bio && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Bio</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedMember.user.profile.bio}</p>
                    </div>
                  )}
                  {selectedMember.user.profile.skills && selectedMember.user.profile.skills.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Skills</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {selectedMember.user.profile.skills.map((skill: string) => (
                          <span key={skill} style={{
                            padding: '0.2rem 0.5rem',
                            background: `${getSkillColor(skill)}20`,
                            border: `1px solid ${getSkillColor(skill)}40`,
                            borderRadius: '999px',
                            fontSize: '0.7rem',
                            color: getSkillColor(skill),
                          }}>{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedMember.user.profile.experience && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Experience</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedMember.user.profile.experience}</p>
                    </div>
                  )}
                  {selectedMember.user.profile.company && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Company</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedMember.user.profile.company}</p>
                    </div>
                  )}
                  {selectedMember.user.profile.country && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Country</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedMember.user.profile.country}</p>
                    </div>
                  )}
                  {selectedMember.user.profile.githubUrl && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>GitHub</p>
                      <a href={selectedMember.user.profile.githubUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                        {selectedMember.user.profile.githubUrl}
                      </a>
                    </div>
                  )}
                  {selectedMember.user.profile.linkedinUrl && (
                    <div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>LinkedIn</p>
                      <a href={selectedMember.user.profile.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'underline' }}>
                        {selectedMember.user.profile.linkedinUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participant Details Modal */}
      {viewingParticipant && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setViewingParticipant(null)}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Participant Details
              </h3>
              <button
                onClick={() => setViewingParticipant(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {viewingParticipant.image && (
                  <Image 
                    src={viewingParticipant.image} 
                    alt={viewingParticipant.name}
                    width={64}
                    height={64}
                    style={{ borderRadius: '50%' }}
                  />
                )}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{viewingParticipant.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {viewingParticipant.id}</p>
                </div>
              </div>
              
              {viewingParticipant.instituteName && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Institute</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{viewingParticipant.instituteName}</p>
                </div>
              )}
              
              {viewingParticipant.domain && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Domain</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{viewingParticipant.domain}</p>
                </div>
              )}
              
              {viewingParticipant.courseSpecialization && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Course/Specialization</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{viewingParticipant.courseSpecialization}</p>
                </div>
              )}
              
              {viewingParticipant.skills && viewingParticipant.skills.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {viewingParticipant.skills.map((skill: string) => (
                      <span key={skill} style={{
                        padding: '0.15rem 0.4rem',
                        background: `${getSkillColor(skill)}20`,
                        border: `1px solid ${getSkillColor(skill)}40`,
                        borderRadius: '999px',
                        fontSize: '0.6rem',
                        color: getSkillColor(skill),
                      }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
