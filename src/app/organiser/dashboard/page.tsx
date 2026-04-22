'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Hackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  _count?: {
    teams: number;
    submissions: number;
  };
}

export default function OrganiserDashboardPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/hackathons');
        const data = await res.json();
        setHackathons(data.data || []);
      } catch (error) {
        console.error('Failed to fetch organiser hackathons:', error);
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
          <h1 className="text-4xl font-bold text-gray-900">Organiser Dashboard</h1>
          <p className="text-gray-600 mt-2">Create events and manage teams, submissions, and operations</p>
        </div>
        <Link href="/create" className="btn btn-primary">
          + Create New Hackathon
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Total Hackathons</p>
          <p className="text-3xl font-bold text-gray-900">{hackathons.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Teams</p>
          <p className="text-3xl font-bold text-gray-900">
            {hackathons.reduce((acc, item) => acc + (item._count?.teams || 0), 0)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900">
            {hackathons.reduce((acc, item) => acc + (item._count?.submissions || 0), 0)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : hackathons.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No hackathons created yet</p>
          <Link href="/create" className="btn btn-primary">
            Create Your First Hackathon
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons.map((hackathon) => (
            <Link
              key={hackathon.id}
              href={`/command-center/${hackathon.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{hackathon.title}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <span className="badge badge-primary">{hackathon.status}</span>
                <p>Teams: {hackathon._count?.teams || 0}</p>
                <p>Submissions: {hackathon._count?.submissions || 0}</p>
                <p>
                  {new Date(hackathon.startDate).toLocaleDateString()} -{' '}
                  {new Date(hackathon.endDate).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
