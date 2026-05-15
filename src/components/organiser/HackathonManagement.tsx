'use client';

import { useState, useEffect } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import HackathonForm from '@/components/HackathonForm';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  isVirtual: boolean;
  location?: string;
  minTeamSize: number;
  maxTeamSize: number;
  _count?: { teams: number; submissions: number };
}

interface Props {
  onSelect: (id: string) => void;
  selectedId: string;
}

function statusBadgeClass(status: string) {
  const s = (status || 'DRAFT').toUpperCase();
  const map: Record<string, string> = {
    DRAFT: 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)]',
    PUBLISHED: 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-accent)]',
    REGISTRATION: 'bg-[var(--accent-dim)] text-[var(--accent)] border-[var(--border-accent)]',
    ONGOING: 'bg-[var(--success-dim)] text-[var(--success)] border-[rgba(16,185,129,0.2)]',
    ENDED: 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)]',
    CANCELLED: 'bg-[var(--error-dim)] text-[var(--error)] border-[rgba(239,68,68,0.2)]',
  };
  return map[s] || 'bg-[var(--bg-raised)] text-[var(--text-muted)] border-[var(--border-default)]';
}

export default function HackathonManagement({ onSelect, selectedId }: Props) {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadHackathons = async () => {
    try {
      const res = await fetch('/api/hackathons?limit=50');
      const data = await res.json();
      setHackathons(data.data || []);
    } catch (err) {
      console.error('Failed to load hackathons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw
          className="h-6 w-6 animate-spin text-[var(--text-muted)]"
          aria-hidden
        />
        <span className="sr-only">Loading hackathons</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Your hackathons
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Select one to enable the other tabs for that event.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary !min-h-[32px] !text-[12px]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create hackathon
        </button>
      </div>

      {showForm && (
        <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--elevation-sm)]">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
            Create new hackathon
          </h3>
          <HackathonForm />
        </div>
      )}

      {hackathons.length === 0 ? (
        <div className="rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] py-12 text-center shadow-[var(--elevation-sm)]">
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            No hackathons created yet.
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn btn-primary !min-h-[32px] !text-[12px]"
          >
            Create your first hackathon
          </button>
        </div>
      ) : (
        <ul className="space-y-2" role="list">
          {hackathons.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onSelect(h.id)}
                className={`w-full rounded-[6px] border text-left transition-colors ${
                  selectedId === h.id
                    ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-root)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]'
                } p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-[var(--text-primary)]">
                        {h.title}
                      </h4>
                      <span
                        className={`rounded-[6px] border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(h.status)}`}
                      >
                        {h.status}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">
                      {h.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[12px] text-[var(--text-muted)]">
                      <span>{h.isVirtual ? 'Virtual' : h.location || 'In-person'}</span>
                      <span>
                        {h.minTeamSize}–{h.maxTeamSize} members
                      </span>
                      <span>
                        {new Date(h.startDate).toLocaleDateString()} –{' '}
                        {new Date(h.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {selectedId === h.id && (
                    <span className="shrink-0 font-mono text-[11px] font-medium text-[var(--accent)]">
                      Selected
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
