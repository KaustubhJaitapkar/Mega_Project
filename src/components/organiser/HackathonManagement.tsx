'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import HackathonForm from '@/components/HackathonForm';

export default function HackathonManagement() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Hackathon Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Hackathon
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Hackathon</h3>
          <HackathonForm />
        </div>
      )}

      {/* Hackathon List */}
      <div className="space-y-4">
        {hackathons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No hackathons created yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              Create Your First Hackathon
            </button>
          </div>
        ) : (
          hackathons.map((hackathon) => (
            <div key={hackathon.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{hackathon.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{hackathon.description}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>📍 {hackathon.venue}</span>
                    <span>👥 {hackathon.minTeamSize}-{hackathon.maxTeamSize} members</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
