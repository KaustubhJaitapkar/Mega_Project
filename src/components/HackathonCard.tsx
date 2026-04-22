'use client';

import Link from 'next/link';

interface HackathonCardProps {
  hackathon: {
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
  };
}

export default function HackathonCard({ hackathon }: HackathonCardProps) {
  const startDate = new Date(hackathon.startDate).toLocaleDateString();
  const endDate = new Date(hackathon.endDate).toLocaleDateString();

  return (
    <Link href={`/participant/hackathons/${hackathon.id}`}>
      <div className="card cursor-pointer hover:shadow-lg transition-shadow">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {hackathon.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {hackathon.description}
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>
              {startDate} - {endDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{hackathon.isVirtual ? '🌐' : '📍'}</span>
            <span>{hackathon.isVirtual ? 'Virtual' : hackathon.location}</span>
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="badge badge-primary">
            {hackathon._count.teams} Teams
          </div>
          <div className="badge badge-success">
            {hackathon._count.submissions} Submissions
          </div>
        </div>
      </div>
    </Link>
  );
}
