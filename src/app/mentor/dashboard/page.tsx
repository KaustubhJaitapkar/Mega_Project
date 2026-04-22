'use client';

import { useEffect, useMemo, useState } from 'react';

export default function MentorDashboardPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [fromMinutes, setFromMinutes] = useState('0');
  const [activeTicketId, setActiveTicketId] = useState('');
  const [resolution, setResolution] = useState('');
  const [notice, setNotice] = useState('');

  async function loadTickets() {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (fromMinutes !== '0') params.set('fromMinutes', fromMinutes);
    const res = await fetch(`/api/mentor/tickets?${params.toString()}`);
    const data = await res.json();
    setTickets(data.data || []);
  }

  useEffect(() => {
    loadTickets();
    const timer = setInterval(loadTickets, 3000);
    return () => clearInterval(timer);
  }, [category, fromMinutes]);

  const openQueue = useMemo(() => tickets.filter((t) => t.status === 'OPEN'), [tickets]);
  const myActive = useMemo(() => tickets.find((t) => t.id === activeTicketId) || tickets.find((t) => t.status === 'IN_PROGRESS'), [tickets, activeTicketId]);

  async function claim(ticketId: string) {
    const res = await fetch(`/api/mentor/tickets/${ticketId}/claim`, { method: 'POST' });
    const data = await res.json();
    setNotice(res.ok ? 'Ticket claimed' : data.error || 'Claim failed');
    if (res.ok) setActiveTicketId(ticketId);
    loadTickets();
  }

  async function resolve(ticketId: string) {
    const res = await fetch(`/api/mentor/tickets/${ticketId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution }),
    });
    const data = await res.json();
    setNotice(res.ok ? 'Ticket resolved' : data.error || 'Resolve failed');
    if (res.ok) {
      setResolution('');
      setActiveTicketId('');
    }
    loadTickets();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
      {notice && <div className="p-3 bg-indigo-100 text-indigo-700 rounded">{notice}</div>}

      <div className="card flex gap-3 items-end">
        <div>
          <label className="text-sm">Filter by tag</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="technical/general/judging" />
        </div>
        <div>
          <label className="text-sm">By time (minutes)</label>
          <select className="input" value={fromMinutes} onChange={(e) => setFromMinutes(e.target.value)}>
            <option value="0">All time</option>
            <option value="15">Last 15 min</option>
            <option value="60">Last 60 min</option>
            <option value="180">Last 180 min</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-3">Help Queue (oldest first)</h2>
          <div className="space-y-3 max-h-96 overflow-auto">
            {openQueue.map((t) => (
              <div key={t.id} className="p-3 border rounded">
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-gray-600">{t.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Team: {t.creator?.name || 'Unknown'} | Tag: {t.category}
                </p>
                <button className="btn btn-primary mt-2" onClick={() => claim(t.id)}>Claim</button>
              </div>
            ))}
            {openQueue.length === 0 && <p className="text-sm text-gray-600">No open tickets</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-3">My Active Ticket</h2>
          {myActive ? (
            <div className="space-y-3">
              <p className="font-semibold">{myActive.title}</p>
              <p className="text-sm text-gray-600">{myActive.description}</p>
              <textarea
                className="input min-h-24"
                placeholder="Resolution notes"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
              />
              <button className="btn btn-primary" onClick={() => resolve(myActive.id)}>
                Resolve Ticket
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No active ticket claimed</p>
          )}
        </div>
      </div>
    </div>
  );
}

