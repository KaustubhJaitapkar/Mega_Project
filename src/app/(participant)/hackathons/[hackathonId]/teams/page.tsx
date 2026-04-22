'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, redirect } from 'next/navigation';
import TeamCard from '@/components/TeamCard';
import { use } from 'react';

interface Team {
  id: string;
  name: string;
  description?: string;
  isOpen: boolean;
  members: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      redirect('/login');
    }

    async function fetchTeams() {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/teams`);
        const data = await res.json();
        setTeams(data.data || []);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) {
      fetchTeams();
    }
  }, [hackathonId, session]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="text-gray-600 mt-2">Join or create a team</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : teams.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No teams yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
