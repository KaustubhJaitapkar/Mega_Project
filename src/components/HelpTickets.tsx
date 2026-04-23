'use client';

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  creator: {
    id: string;
    name: string;
    email?: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email?: string;
  };
  createdAt: string;
  resolvedAt?: string;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  skills: string[];
}

interface HelpTicketsProps {
  hackathonId: string;
}

export default function HelpTickets({ hackathonId }: HelpTicketsProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [teamSkills, setTeamSkills] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [assigning, setAssigning] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketRes, staffRes, teamsRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/tickets${filterStatus ? `?status=${filterStatus}` : ''}`),
          fetch(`/api/hackathons/${hackathonId}/staff`),
          fetch(`/api/hackathons/${hackathonId}/teams`),
        ]);
        const [ticketData, staffData, teamsData] = await Promise.all([
          ticketRes.json(),
          staffRes.json(),
          teamsRes.json(),
        ]);

        setTickets(ticketData.data || []);

        const mentorList: Mentor[] = (staffData.data?.mentors || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          skills: m.profile?.skills || [],
        }));
        setMentors(mentorList);

        const skillsMap: Record<string, string[]> = {};
        for (const team of teamsData.data || []) {
          const skills = [
            ...new Set([
              ...(team.members?.flatMap((m: any) => m.user?.profile?.skills || []) || []),
              ...(team.submission?.technologies || []),
            ]),
          ];
          if (team.creatorId) skillsMap[team.creatorId] = skills;
          for (const member of team.members || []) {
            skillsMap[member.userId] = skills;
          }
        }
        setTeamSkills(skillsMap);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) fetchData();
  }, [hackathonId, filterStatus]);

  function getStatusColor(status: string) {
    switch (status) {
      case 'OPEN': return 'badge-warning';
      case 'IN_PROGRESS': return 'badge-primary';
      case 'RESOLVED': return 'badge-success';
      default: return '';
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'high': return 'badge-danger';
      case 'normal': return 'badge-primary';
      case 'low': return '';
      default: return '';
    }
  }

  function findBestMentors(ticketCreatorId: string): Mentor[] {
    const creatorSkills = teamSkills[ticketCreatorId] || [];
    if (creatorSkills.length === 0) return [];

    return mentors
      .map((mentor) => {
        const overlap = mentor.skills.filter((s) =>
          creatorSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
        ).length;
        return { mentor, overlap };
      })
      .filter((m) => m.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map((m) => m.mentor);
  }

  async function assignMentorToTicket(ticketId: string, mentorId: string) {
    setAssigning(ticketId + mentorId);
    try {
      const res = await fetch(`/api/mentor/tickets/${ticketId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: 'IN_PROGRESS', assignedTo: mentors.find((m) => m.id === mentorId) }
              : t
          )
        );
      }
    } finally {
      setAssigning('');
    }
  }

  function timeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m`;
    return `${Math.floor(hours / 24)}d`;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Mentor Overview */}
      {mentors.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Mentors</p>
          <div className="flex flex-wrap gap-2">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border text-sm">
                <span className="font-medium text-gray-700">{mentor.name}</span>
                {mentor.skills.length > 0 && (
                  <div className="flex gap-1">
                    {mentor.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const bestMentors = findBestMentors(ticket.creator.id);
            const creatorSkills = teamSkills[ticket.creator.id] || [];

            return (
              <div key={ticket.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 flex-1">{ticket.title}</h3>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`badge ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    {ticket.priority === 'high' && (
                      <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 text-sm mb-3">{ticket.description}</p>

                {/* Team Skills */}
                {creatorSkills.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Team Tech Stack</p>
                    <div className="flex flex-wrap gap-1">
                      {creatorSkills.slice(0, 8).map((skill) => (
                        <span key={skill} className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 pt-3 border-t">
                  <div>
                    <p className="text-xs text-gray-400">Category</p>
                    <p className="font-medium">{ticket.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Created By</p>
                    <p className="font-medium">{ticket.creator.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Assigned To</p>
                    <p className="font-medium">{ticket.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Waiting</p>
                    <p className="font-medium">{timeSince(ticket.createdAt)}</p>
                  </div>
                </div>

                {/* Best Mentor Matches */}
                {ticket.status === 'OPEN' && bestMentors.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Best Mentor Match{bestMentors.length > 1 ? 'es' : ''} (by skill overlap)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {bestMentors.map((mentor) => (
                        <button
                          key={mentor.id}
                          onClick={() => assignMentorToTicket(ticket.id, mentor.id)}
                          disabled={assigning === ticket.id + mentor.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors text-sm"
                        >
                          <span className="font-medium text-indigo-700">{mentor.name}</span>
                          <div className="flex gap-1">
                            {mentor.skills.slice(0, 2).map((s) => (
                              <span key={s} className="text-[9px] px-1 py-0.5 rounded bg-white text-indigo-500">
                                {s}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-indigo-400">
                            {assigning === ticket.id + mentor.id ? '...' : 'Assign'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
