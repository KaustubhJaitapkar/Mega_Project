'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
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

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-600/30 text-gray-400',
      REGISTRATION: 'bg-blue-500/20 text-blue-400',
      ONGOING: 'bg-emerald-500/20 text-emerald-400',
      ENDED: 'bg-purple-500/20 text-purple-400',
      CANCELLED: 'bg-red-500/20 text-red-400',
    };
    return map[s] || 'bg-gray-600/30 text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Your Hackathons</h3>
          <p className="text-sm text-gray-500">Select one to manage in the tabs below</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Hackathon
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Hackathon</h3>
          <HackathonForm />
        </div>
      )}

      {hackathons.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No hackathons created yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
          >
            Create Your First Hackathon
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {hackathons.map((h) => (
            <button
              key={h.id}
              onClick={() => onSelect(h.id)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedId === h.id
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-white">{h.title}</h4>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${statusColor(h.status)}`}>
                      {h.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-1">{h.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{h.isVirtual ? 'Virtual' : h.location || 'In-person'}</span>
                    <span>{h.minTeamSize}-{h.maxTeamSize} members</span>
                    <span>{new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {selectedId === h.id && (
                  <span className="text-emerald-400 text-xs font-medium mt-1">Selected</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
