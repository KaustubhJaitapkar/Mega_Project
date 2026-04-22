'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Trash2, Users, Shuffle } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  hackathonId: string;
}

export default function StaffManagement({ hackathonId }: Props) {
  const [judges, setJudges] = useState<StaffMember[]>([]);
  const [mentors, setMentors] = useState<StaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'JUDGE' | 'MENTOR'>('JUDGE');
  const [loading, setLoading] = useState(false);

  const loadStaff = async () => {
    const res = await fetch(`/api/hackathons/${hackathonId}/staff`);
    const data = await res.json();
    setJudges(data.data.judges || []);
    setMentors(data.data.mentors || []);
  };

  useEffect(() => {
    loadStaff();
  }, [hackathonId]);

  const handleAddExisting = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: role }),
      });

      if (res.ok) {
        loadStaff();
        setEmail('');
      }
    } catch (error) {
      console.error('Failed to add existing staff:', error);
    }
    setLoading(false);
  };

  const handleSendInvite = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (res.ok) {
        alert('Invite email sent!');
        setEmail('');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
    setLoading(false);
  };

  const handleAutoAssign = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff/auto-assign`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        loadStaff();
      } else {
        const data = await res.json();
        alert(data.error || 'Auto-assign failed');
      }
    } catch (error) {
      console.error('Auto-assign failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Staff Management</h2>

      {/* Add Staff Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Existing User */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Add Existing User</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="User email"
              className="input flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'JUDGE' | 'MENTOR')}
              className="input"
            >
              <option value="JUDGE">Judge</option>
              <option value="MENTOR">Mentor</option>
            </select>
            <button
              onClick={handleAddExisting}
              disabled={loading || !email}
              className="btn btn-primary px-4 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Send Invite */}
        <div className="p-4 bg-emerald-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Send Invite Email</h3>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Invite email"
              className="input flex-1"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'JUDGE' | 'MENTOR')}
              className="input"
            >
              <option value="JUDGE">Judge</option>
              <option value="MENTOR">Mentor</option>
            </select>
            <button
              onClick={handleSendInvite}
              disabled={loading || !email}
              className="btn btn-success px-4 flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-assign Button */}
      <div className="mb-6">
        <button
          onClick={handleAutoAssign}
          disabled={loading}
          className="btn btn-accent flex items-center gap-2"
        >
          <Shuffle className="w-4 h-4" />
          Auto-assign Mentors to Teams
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Judges Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Judges ({judges.length})</h3>
          <div className="space-y-2">
            {judges.length === 0 ? (
              <p className="text-sm text-gray-600">No judges added yet</p>
            ) : (
              judges.map((judge) => (
                <div
                  key={judge.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900">{judge.name}</p>
                    <p className="text-sm text-gray-600">{judge.email}</p>
                  </div>
                  <button className="text-red-600 hover:bg-red-50 p-2 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mentors Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentors ({mentors.length})</h3>
          <div className="space-y-2">
            {mentors.length === 0 ? (
              <p className="text-sm text-gray-600">No mentors added yet</p>
            ) : (
              mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded"
                >
                  <div>
                    <p className="font-medium text-gray-900">{mentor.name}</p>
                    <p className="text-sm text-gray-600">{mentor.email}</p>
                  </div>
                  <button className="text-red-600 hover:bg-red-50 p-2 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
