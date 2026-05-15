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
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] cursor-pointer">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{team.name}</h3>
            {team.isOpen && (
              <span className="badge badge-success">Open</span>
            )}
          </div>
          {team.description && (
            <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
              {team.description}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>{team.members.length} members</span>
          </div>

          <div className="flex gap-2">
            {team.members.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-dim)] text-[11px] font-bold text-[var(--accent)]"
                title={member.user.name}
              >
                {member.user.name.charAt(0)}
              </div>
            ))}
            {team.members.length > 3 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-raised)] text-[11px] font-bold text-[var(--text-muted)]">
                +{team.members.length - 3}
              </div>
            )}
          </div>

          <button className="btn btn-primary w-full !text-[13px]">
            {team.isOpen ? 'Join Team' : 'View'}
          </button>
        </div>
      </div>
    </Link>
  );
}
