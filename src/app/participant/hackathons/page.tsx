'use client';

import { useEffect, useState } from 'react';
import HackathonCard from '@/components/HackathonCard';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  _count: {
    teams: number;
    submissions: number;
  };
}

export default function ExploreHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/hackathons?limit=100');
        const data = await res.json();
        setHackathons(data.data || []);
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHackathons();
  }, []);

  const filtered = hackathons.filter((h) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      h.title.toLowerCase().includes(term) ||
      h.description.toLowerCase().includes(term) ||
      (h.location || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Hackathons</h1>
          <p className="text-gray-600 mt-2">Discover and join upcoming hackathons</p>
        </div>
        <div className="w-full max-w-sm">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, location, or keyword"
            className="input"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">No hackathons found for that search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((hackathon) => (
            <HackathonCard key={hackathon.id} hackathon={hackathon} />
          ))}
        </div>
      )}
    </div>
  );
}
