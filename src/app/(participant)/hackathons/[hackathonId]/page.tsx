'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Hackathon {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  location?: string;
  isVirtual: boolean;
  prize?: string;
  rules?: string;
  maxTeamSize: number;
  minTeamSize: number;
  organiser: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  timelines: Array<{
    id: string;
    title: string;
    description?: string | null;
    startTime: string;
    endTime: string;
  }>;
  _count?: {
    teams: number;
    submissions: number;
    attendances: number;
  };
}

const TABS = [
  { id: 'overview', label: 'Stages & Timeline' },
  { id: 'details', label: 'Details' },
  { id: 'dates', label: 'Dates & Deadlines' },
  { id: 'prizes', label: 'Prizes' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'faqs', label: 'FAQs & Discussions' },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatDateOnly(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function HackathonDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const hackathonId = params.hackathonId as string;
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [isRegistered, setIsRegistered] = useState(false);
  const [unregistering, setUnregistering] = useState(false);

  useEffect(() => {
    async function fetchHackathon() {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}`);
        const data = await res.json();
        setHackathon(data.data);
        const regRes = await fetch(`/api/hackathons/${hackathonId}/register`);
        const regData = await regRes.json();
        setIsRegistered(!!regData?.data?.registered);
      } catch (error) {
        console.error('Failed to fetch hackathon:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (hackathonId) {
      fetchHackathon();
    }
  }, [hackathonId]);

  const daysLeft = useMemo(() => {
    if (!hackathon) return 0;
    const end = new Date(hackathon.registrationDeadline).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24)));
  }, [hackathon]);

  async function unregisterFromHackathon() {
    if (!hackathon) return;
    setUnregistering(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathon.id}/register`, { method: 'DELETE' });
      if (res.ok) {
        setIsRegistered(false);
        setHackathon((prev) =>
          prev
            ? {
                ...prev,
                _count: {
                  ...prev._count,
                  attendances: Math.max(0, (prev._count?.attendances || 0) - 1),
                },
              }
            : prev
        );
      } else {
        const d = await res.json();
        alert(d.error || 'Unregister failed');
      }
    } finally {
      setUnregistering(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="p-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Hackathon not found</p>
        </div>
      </div>
    );
  }

  const teamRange = `${hackathon.minTeamSize} - ${hackathon.maxTeamSize} Members`;
  const formattedLocation = hackathon.isVirtual ? 'Online' : hackathon.location || 'Venue TBA';
  const registeredCount = hackathon._count?.attendances ?? 0;
  const timelineItems = hackathon.timelines || [];
  const rulesText = (hackathon.rules || '').split('\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 rounded-3xl overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_45%),radial-gradient(circle_at_bottom_right,#e0f2fe,transparent_45%),linear-gradient(135deg,#0f172a,#1e293b)] text-white">
          <div className="px-8 py-10">
            <div className="flex items-center gap-3 text-sm text-slate-200 mb-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                {hackathon.isVirtual ? 'Online' : 'Offline'}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
                {formatDateOnly(hackathon.startDate)} - {formatDateOnly(hackathon.endDate)}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-100">
                {hackathon.status}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{hackathon.title}</h1>
            <p className="text-slate-200 max-w-2xl">{hackathon.description}</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className="px-4 py-2 rounded-2xl bg-white/10">
                <div className="text-slate-300">Location</div>
                <div className="font-semibold text-white">{formattedLocation}</div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/10">
                <div className="text-slate-300">Team Size</div>
                <div className="font-semibold text-white">{teamRange}</div>
              </div>
              <div className="px-4 py-2 rounded-2xl bg-white/10">
                <div className="text-slate-300">Prize Pool</div>
                <div className="font-semibold text-white">{hackathon.prize || 'TBD'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="sticky top-0 z-10 bg-slate-50 pt-2 pb-3 border-b border-slate-200">
              <div className="flex flex-wrap gap-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-sm font-medium pb-2 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-700'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4">Stages and Timeline</h2>
                  {timelineItems.length === 0 ? (
                    <p className="text-slate-500">Timeline will be announced soon.</p>
                  ) : (
                    <div className="space-y-4">
                      {timelineItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start">
                          <div className="w-16 text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {new Date(item.startTime).getDate()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(item.startTime).toLocaleString('default', { month: 'short' })}
                            </div>
                          </div>
                          <div className="flex-1 border border-slate-200 rounded-2xl p-4">
                            <div className="font-semibold text-slate-900">{item.title}</div>
                            <div className="text-sm text-slate-500 mt-1">
                              {formatDate(item.startTime)} → {formatDate(item.endTime)}
                            </div>
                            {item.description && (
                              <p className="text-sm text-slate-600 mt-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'details' && (
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-3">All that you need to know</h2>
                  <p className="text-slate-600 mb-4">Organised by {hackathon.organiser.name}</p>
                  <div className="space-y-3 text-slate-700">
                    {rulesText.length > 0 ? (
                      rulesText.map((line, idx) => (
                        <p key={`${line}-${idx}`} className="leading-relaxed">{line}</p>
                      ))
                    ) : (
                      <p className="leading-relaxed">More details will be shared by the organisers soon.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dates' && (
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4">Important dates & deadlines</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 border border-slate-200 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-semibold flex items-center justify-center">
                        {new Date(hackathon.registrationDeadline).getDate()}
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Registration Deadline</div>
                        <div className="font-semibold text-slate-900">{formatDate(hackathon.registrationDeadline)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border border-slate-200 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-semibold flex items-center justify-center">
                        {new Date(hackathon.startDate).getDate()}
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Hackathon Starts</div>
                        <div className="font-semibold text-slate-900">{formatDate(hackathon.startDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 border border-slate-200 rounded-2xl p-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-semibold flex items-center justify-center">
                        {new Date(hackathon.submissionDeadline).getDate()}
                      </div>
                      <div>
                        <div className="text-sm text-slate-500">Submission Deadline</div>
                        <div className="font-semibold text-slate-900">{formatDate(hackathon.submissionDeadline)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'prizes' && (
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4">Rewards and Prizes</h2>
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-500">Total Prize Pool</div>
                        <div className="text-2xl font-bold text-slate-900">{hackathon.prize || 'To be announced'}</div>
                      </div>
                      <div className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">Certificate</div>
                    </div>
                    <div className="border border-slate-200 rounded-2xl p-4">
                      <div className="font-semibold text-slate-900">Participation Certificates</div>
                      <p className="text-sm text-slate-600 mt-1">All qualifying teams receive digital certificates.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4">Reviews</h2>
                  <p className="text-slate-600">Reviews will appear here once participants share feedback.</p>
                </div>
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="mt-6 space-y-6">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-2xl font-semibold text-slate-900 mb-4">FAQs & Discussions</h2>
                  <p className="text-slate-600">Have questions? Start a discussion once registration opens.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-slate-900 px-3 py-1 rounded-full">
                {daysLeft} Days Left
              </div>
              <div className="mt-4 border border-emerald-200 rounded-2xl p-4 bg-emerald-50">
                <div className="text-sm text-emerald-700 font-semibold">You&apos;re eligible</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-semibold">
                    {(session?.user?.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{session?.user?.name || 'Participant'}</div>
                    <div className="text-xs text-slate-500">{session?.user?.email || 'Sign in to continue'}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {isRegistered ? (
                  <div className="space-y-2">
                    <Link
                      href={`/participant/my-team?hackathonId=${hackathon.id}`}
                      className="btn btn-primary w-full"
                    >
                      Go to My Team
                    </Link>
                    <button
                      onClick={unregisterFromHackathon}
                      className="btn btn-secondary w-full"
                      disabled={unregistering}
                    >
                      {unregistering ? 'Unregistering...' : 'Unregister'}
                    </button>
                  </div>
                ) : (
                  <Link
                    href={`/participant/hackathons/${hackathon.id}/register`}
                    className="btn btn-primary w-full"
                  >
                    Register
                  </Link>
                )}
                <div className="text-xs text-slate-500 mt-3 text-center">
                  {registeredCount} Registered
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4">
              <div className="font-semibold text-slate-900 mb-2">Featured</div>
              <div className="space-y-3">
                <div className="border border-slate-100 rounded-2xl p-3 text-sm text-slate-600">New challenges will appear here</div>
                <div className="border border-slate-100 rounded-2xl p-3 text-sm text-slate-600">Stay tuned for sponsor updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
