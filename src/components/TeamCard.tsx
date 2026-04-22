'use client';

import Link from 'next/link';

interface TeamCardProps {
  team: {
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
  };
}

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <Link href={`/teams/${team.id}`}>
      <div className="card cursor-pointer hover:shadow-lg transition-shadow">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
            {team.isOpen && (
              <span className="badge badge-success">Open</span>
            )}
          </div>
          {team.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {team.description}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>👥</span>
            <span>{team.members.length} members</span>
          </div>

          <div className="flex gap-2">
            {team.members.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-xs font-medium"
                title={member.user.name}
              >
                {member.user.name.charAt(0)}
              </div>
            ))}
            {team.members.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-medium">
                +{team.members.length - 3}
              </div>
            )}
          </div>

          <button className="btn btn-primary w-full text-sm">
            {team.isOpen ? 'Join Team' : 'View'}
          </button>
        </div>
      </div>
    </Link>
  );
}
