'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, redirect } from 'next/navigation';
import TeamCard from '@/components/TeamCard';

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
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

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

  async function fetchRecommendations() {
    setLoadingRecommendations(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'teammates' }),
      });
      const data = await res.json();
      if (data.data) {
        setRecommendations(data.data);
        setShowRecommendations(true);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <p className="text-gray-600 mt-2">Join or create a team</p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              if (showRecommendations) {
                setShowRecommendations(false);
              } else {
                fetchRecommendations();
              }
            }}
            disabled={loadingRecommendations}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loadingRecommendations ? 'Loading...' : showRecommendations ? 'Hide Recommendations' : 'Find Teammates'}
          </button>
        </div>
      </div>

      {showRecommendations && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recommended Teammates</h2>
          {recommendations.length === 0 ? (
            <p className="text-gray-600">No recommendations found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                      {rec.participant?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-medium">{rec.participant?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">{rec.participant?.domain || ''}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.participant?.bio?.substring(0, 100) || ''}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rec.participant?.skills?.map((skill: string) => (
                      <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Match score: {rec.score} - {rec.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
