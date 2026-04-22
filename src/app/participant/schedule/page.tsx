'use client';

import { useEffect, useState } from 'react';

export default function ParticipantSchedulePage() {
  const [activeHackathon, setActiveHackathon] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState({
    category: 'technical',
    title: '',
    description: '',
    priority: 'normal',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function boot() {
      const hRes = await fetch('/api/hackathons?limit=50');
      const hData = await hRes.json();
      const active =
        (hData.data || []).find((h: any) => h.status === 'ONGOING') ||
        (hData.data || []).find((h: any) => h.status === 'REGISTRATION');
      if (!active) return;
      setActiveHackathon(active);
    }
    boot();
  }, []);

  useEffect(() => {
    if (!activeHackathon) return;
    async function loadDetails() {
      const [details, ticketData, announcementData] = await Promise.all([
        fetch(`/api/hackathons/${activeHackathon.id}`).then((r) => r.json()),
        fetch(`/api/hackathons/${activeHackathon.id}/tickets`).then((r) => r.json()),
        fetch(`/api/hackathons/${activeHackathon.id}/announcements`).then((r) => r.json()),
      ]);
      setActiveHackathon(details.data);
      setTickets(ticketData.data || []);
      setAnnouncements((announcementData.data || []).slice(0, 3));
    }
    loadDetails();

    const interval = setInterval(loadDetails, 3000);
    return () => clearInterval(interval);
  }, [activeHackathon?.id]);

  async function raiseTicket() {
    if (!activeHackathon) return;
    const active = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    if (active.length >= 1) {
      setMessage('Only one active ticket is allowed per team at a time.');
      return;
    }
    const res = await fetch(`/api/hackathons/${activeHackathon.id}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketForm),
    });
    if (res.ok) {
      setTicketForm({ category: 'technical', title: '', description: '', priority: 'normal' });
      setMessage('Ticket raised successfully');
    }
  }

  return (
    <div className="p-8 space-y-5">
      <h1 className="text-3xl font-bold">Schedule & Support</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Timeline</h2>
        <div className="space-y-2">
          {(activeHackathon?.timelines || []).map((e: any) => (
            <div key={e.id} className="p-2 border rounded">
              <p className="font-medium">{e.title}</p>
              <p className="text-sm text-gray-600">
                {new Date(e.startTime).toLocaleString()} - {new Date(e.endTime).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-3">Announcements (latest 3)</h2>
        <div className="space-y-2">
          {announcements.map((a) => (
            <div key={a.id} className="p-2 border rounded">
              <p className="font-medium">{a.title}</p>
              <p className="text-sm text-gray-600">{a.content}</p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-sm text-gray-600">No announcements</p>}
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="text-xl font-semibold">Mentor Help Ticket</h2>
        {message && <div className="text-sm text-indigo-700">{message}</div>}
        <input className="input" placeholder="Title" value={ticketForm.title} onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })} />
        <select className="input" value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}>
          <option value="technical">technical</option>
          <option value="general">general</option>
          <option value="judging">judging</option>
        </select>
        <textarea className="input min-h-24" placeholder="Description" value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} />
        <button className="btn btn-primary" onClick={raiseTicket}>Raise Ticket</button>

        <div>
          <h3 className="font-semibold mt-4 mb-2">Ticket Status (realtime polling)</h3>
          <div className="space-y-2">
            {tickets.slice(0, 5).map((t) => (
              <div key={t.id} className="p-2 border rounded flex justify-between">
                <span>{t.title}</span>
                <span>{t.status === 'IN_PROGRESS' ? 'claimed' : t.status.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
