'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  submissionDeadline: string;
  registrationDeadline: string;
  timelines?: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  }>;
}

export default function ParticipantDashboardPage() {
  const router = useRouter();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [activeHackathon, setActiveHackathon] = useState<Hackathon | null>(null);
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; createdAt: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [registeredHackathonIds, setRegisteredHackathonIds] = useState<string[]>([]);
  const [unregisteringId, setUnregisteringId] = useState('');

  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/hackathons?limit=50');
        const data = await res.json();
        const list = data.data || [];
        setHackathons(list);
        const registrationChecks = await Promise.all(
          list.map(async (h: Hackathon) => {
            const r = await fetch(`/api/hackathons/${h.id}/register`);
            const d = await r.json();
            return d?.data?.registered ? h.id : null;
          })
        );
        const registeredIds = registrationChecks.filter(Boolean) as string[];
        setRegisteredHackathonIds(registeredIds);
        const registeredList = list.filter((h: Hackathon) => registeredIds.includes(h.id));
        const active =
          registeredList.find((h: Hackathon) => h.status === 'ONGOING') ||
          registeredList.find((h: Hackathon) => h.status === 'REGISTRATION') ||
          registeredList[0] ||
          null;
        setActiveHackathon(active);
      } catch (error) {
        console.error('Failed to fetch hackathons:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchHackathons();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    async function loadAnnouncements() {
      if (!activeHackathon) return;
      const res = await fetch(`/api/hackathons/${activeHackathon.id}/announcements`);
      const data = await res.json();
      setAnnouncements((data.data || []).slice(0, 3));
    }
    loadAnnouncements();
  }, [activeHackathon]);

  const countdownTarget = activeHackathon
    ? new Date(
        activeHackathon.status === 'REGISTRATION'
          ? activeHackathon.registrationDeadline
          : activeHackathon.submissionDeadline
      ).getTime()
    : 0;
  const countdownDiff = Math.max(0, countdownTarget - now);
  const hours = Math.floor(countdownDiff / (1000 * 60 * 60));
  const mins = Math.floor((countdownDiff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((countdownDiff % (1000 * 60)) / 1000);
  const nextEvent = activeHackathon?.timelines?.find((ev) => new Date(ev.startTime).getTime() > now);

  async function unregisterFromHackathon(hackathonId: string) {
    setUnregisteringId(hackathonId);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/register`, { method: 'DELETE' });
      if (res.ok) {
        setRegisteredHackathonIds((prev) => prev.filter((id) => id !== hackathonId));
      } else {
        const d = await res.json();
        alert(d.error || 'Unregister failed');
      }
    } finally {
      setUnregisteringId('');
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Participant Dashboard</h1>
          <p className="text-gray-600 mt-2">Discover hackathons and start building with teams</p>
        </div>
        <Link href="/participant/profile" className="btn btn-secondary">
          Complete Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm text-gray-500">Registered Hackathons</p>
          <p className="text-3xl font-bold text-gray-900">{registeredHackathonIds.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Current/Next Event</p>
          <p className="text-lg font-semibold text-gray-900">{nextEvent?.title || 'No upcoming event'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Countdown</p>
          <p className="text-lg font-semibold text-gray-900">
            {hours}h {mins}m {secs}s
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Navigation</p>
          <p className="text-lg font-semibold text-gray-900">My Team, Submit, Schedule</p>
        </div>
      </div>

      {activeHackathon && (
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{activeHackathon.title}</h2>
              <p className="text-gray-600">{activeHackathon.description}</p>
              <p className="text-sm text-gray-600 mt-2">
                {activeHackathon.isVirtual ? 'Virtual' : activeHackathon.location || 'Venue TBA'}
              </p>
            </div>
            <div className="flex gap-2">
              {registeredHackathonIds.includes(activeHackathon.id) ? (
                <>
                  <Link href={`/participant/my-team?hackathonId=${activeHackathon.id}`} className="btn btn-primary">My Team</Link>
                  <button
                    className="btn btn-secondary"
                    onClick={() => unregisterFromHackathon(activeHackathon.id)}
                    disabled={unregisteringId === activeHackathon.id}
                  >
                    {unregisteringId === activeHackathon.id ? 'Unregistering...' : 'Unregister'}
                  </button>
                </>
              ) : (
                <Link
                  href={`/participant/hackathons/${activeHackathon.id}/register`}
                  className="btn btn-primary"
                >
                  Register
                </Link>
              )}
              <Link href="/participant/submit" className="btn btn-secondary">Submit</Link>
            </div>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold mb-2">Timeline</h3>
            <div className="space-y-2">
              {(activeHackathon.timelines || []).slice(0, 6).map((ev) => {
                const isCurrent =
                  new Date(ev.startTime).getTime() <= now && new Date(ev.endTime).getTime() >= now;
                const isNext = !isCurrent && nextEvent?.id === ev.id;
                return (
                  <div key={ev.id} className={`p-2 rounded border ${isCurrent ? 'bg-green-50 border-green-300' : isNext ? 'bg-yellow-50 border-yellow-300' : ''}`}>
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold mb-2">Latest Announcements</h3>
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="p-2 rounded border">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-gray-600">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="text-sm text-gray-600">No announcements yet</p>}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : registeredHackathonIds.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">You have not registered for any hackathons yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hackathons
            .filter((hackathon) => registeredHackathonIds.includes(hackathon.id))
            .map((hackathon) => (
              <div
                key={hackathon.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/participant/hackathons/${hackathon.id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    router.push(`/participant/hackathons/${hackathon.id}`);
                  }
                }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{hackathon.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{hackathon.description}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <span className="badge badge-primary">{hackathon.status}</span>
                  <p>
                    {new Date(hackathon.startDate).toLocaleDateString()} -{' '}
                    {new Date(hackathon.endDate).toLocaleDateString()}
                  </p>
                  <p>{hackathon.isVirtual ? 'Virtual' : `In-person: ${hackathon.location || 'TBA'}`}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/participant/my-team?hackathonId=${hackathon.id}`}
                    className="btn btn-primary text-sm"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Create/Join Team
                  </Link>
                  <button
                    className="btn btn-secondary text-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      unregisterFromHackathon(hackathon.id);
                    }}
                    disabled={unregisteringId === hackathon.id}
                  >
                    {unregisteringId === hackathon.id ? 'Unregistering...' : 'Unregister'}
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
