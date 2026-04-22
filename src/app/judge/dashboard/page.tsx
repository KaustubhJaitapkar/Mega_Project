'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
}

export default function JudgeDashboardPage() {
  const { data: session } = useSession();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [progress, setProgress] = useState<Record<string, { scored: number; pending: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const role = (session?.user as any)?.role || 'JUDGE';
  const isMentor = role === 'MENTOR';

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/hackathons');
        const data = await res.json();
        const list = data.data || [];
        setHackathons(list);
        if (!isMentor) {
          const entries = await Promise.all(
            list.map(async (h: Hackathon) => {
              const teamRes = await fetch(`/api/judge/teams?hackathonId=${h.id}`);
              const teamData = await teamRes.json();
              return [h.id, { scored: teamData.data?.scored || 0, pending: teamData.data?.pending || 0 }] as const;
            })
          );
          setProgress(Object.fromEntries(entries));
        }
      } catch (error) {
        console.error('Failed to fetch judging list:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHackathons();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            {isMentor ? 'Mentor Dashboard' : 'Judge Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isMentor
              ? 'Guide teams and support evaluation quality'
              : 'Review projects and submit fair scores'}
          </p>
        </div>
        <Link href="/profile" className="btn btn-secondary">
          Update Expertise
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">{isMentor ? 'Assigned Events' : 'Judging Events'}</p>
          <p className="text-3xl font-bold text-gray-900">{hackathons.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Priority</p>
          <p className="text-lg font-semibold text-gray-900">
            {isMentor ? 'Resolve team blockers quickly' : 'Score all pending submissions'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Workflow</p>
          <p className="text-lg font-semibold text-gray-900">Open event and start reviewing</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No events assigned yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <Link
              key={hackathon.id}
                href={isMentor ? '/mentor/dashboard' : `/judging/${hackathon.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{hackathon.title}</h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <span className="badge badge-primary">{hackathon.status}</span>
                <p>
                  {new Date(hackathon.startDate).toLocaleDateString()} -{' '}
                  {new Date(hackathon.endDate).toLocaleDateString()}
                </p>
                  {!isMentor && (
                    <p>
                      Progress: {progress[hackathon.id]?.scored || 0} scored / {progress[hackathon.id]?.pending || 0} pending
                    </p>
                  )}
              </div>
              <span className="btn btn-primary text-sm w-full text-center inline-block">
                {isMentor ? 'Open Mentoring Panel' : 'Start Judging'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
