// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams } from 'next/navigation';

// interface Stats {
//   totalTeams: number;
//   participantsCount: number;
//   totalSubmissions: number;
//   submittedCount: number;
//   healthyCount: number;
//   openTickets: number;
//   totalAttendances: number;
//   averageTeamSize: number;
//   averageScore: number;
//   totalScores: number;
//   teamDistribution: Record<string, number>;
//   skillHeatmap: Array<{ skill: string; count: number }>;
//   trends: {
//     timestamp: string;
//     teamCount: number;
//     submissionCount: number;
//     openTickets: number;
//   };
// }

// interface Announcement {
//   id: string;
//   title: string;
//   content: string;
//   author: {
//     id: string;
//     name: string;
//   };
//   isUrgent: boolean;
//   createdAt: string;
// }

// export default function CommandCenterPage() {
//   const params = useParams();
//   const hackathonId = params.hackathonId as string;
//   const [stats, setStats] = useState<Stats | null>(null);
//   const [announcements, setAnnouncements] = useState<Announcement[]>([]);
//   const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', isUrgent: false });
//   const [announcementChannel, setAnnouncementChannel] = useState('website');
//   const [submissions, setSubmissions] = useState<any[]>([]);
//   const [teams, setTeams] = useState<any[]>([]);
//   const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
//   const [timelineForm, setTimelineForm] = useState({
//     id: '',
//     title: '',
//     description: '',
//     type: 'general',
//     startTime: '',
//     endTime: '',
//   });
//   const [staffEmail, setStaffEmail] = useState('');
//   const [staffType, setStaffType] = useState<'JUDGE' | 'MENTOR'>('JUDGE');
//   const [staff, setStaff] = useState<{ judges: any[]; mentors: any[] }>({ judges: [], mentors: [] });
//   const [rubric, setRubric] = useState({
//     name: 'Main Rubric',
//     description: '',
//     maxScore: 100,
//     items: [
//       { name: 'Innovation', weight: 40, maxScore: 10 },
//       { name: 'Execution', weight: 30, maxScore: 10 },
//       { name: 'Impact', weight: 30, maxScore: 10 },
//     ],
//   });
//   const [statusControl, setStatusControl] = useState('draft');
//   const [maxTeams, setMaxTeams] = useState(100);
//   const [extendDeadline, setExtendDeadline] = useState('');
//   const [judgingControl, setJudgingControl] = useState({ judgingOpen: false, blindMode: false });
//   const [certificateUserId, setCertificateUserId] = useState('');
//   const [certificateType, setCertificateType] = useState('PARTICIPANT');
//   const [isLoading, setIsLoading] = useState(true);
//   const [isPublishing, setIsPublishing] = useState(false);
//   const [feedback, setFeedback] = useState('');

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const [statsRes, announcementsRes, submissionsRes, hackathonRes, staffRes, judgingRes] = await Promise.all([
//           fetch(`/api/hackathons/${hackathonId}/stats`),
//           fetch(`/api/hackathons/${hackathonId}/announcements?limit=5`),
//           fetch(`/api/hackathons/${hackathonId}/submissions`),
//           fetch(`/api/hackathons/${hackathonId}`),
//           fetch(`/api/hackathons/${hackathonId}/staff`),
//           fetch(`/api/hackathons/${hackathonId}/judging-control`),
//         ]);

//         const statsData = await statsRes.json();
//         const announcementsData = await announcementsRes.json();
//         const submissionsData = await submissionsRes.json();
//         const hackathonData = await hackathonRes.json();
//         const staffData = await staffRes.json();
//         const judgingData = await judgingRes.json();

//         setStats(statsData.data);
//         setAnnouncements(announcementsData.data || []);
//         setSubmissions(submissionsData.data || []);
//         setTeams(hackathonData.data?.teams || []);
//         setTimelineEvents(hackathonData.data?.timelines || []);
//         setStaff({
//           judges: staffData.data?.judges || [],
//           mentors: staffData.data?.mentors || [],
//         });
//         setJudgingControl({
//           judgingOpen: !!judgingData.data?.judgingOpen,
//           blindMode: !!judgingData.data?.blindMode,
//         });
//       } catch (error) {
//         console.error('Failed to fetch data:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     if (hackathonId) {
//       fetchData();
//     }
//   }, [hackathonId]);

//   async function handlePublishAnnouncement() {
//     if (!newAnnouncement.title || !newAnnouncement.content) {
//       alert('Please fill in all fields');
//       return;
//     }

//     setIsPublishing(true);
//     try {
//       const res = await fetch(`/api/hackathons/${hackathonId}/announcements`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ...newAnnouncement, channel: announcementChannel }),
//       });

//       if (res.ok) {
//         const data = await res.json();
//         setAnnouncements([data.data, ...announcements]);
//         setNewAnnouncement({ title: '', content: '', isUrgent: false });
//         alert('Announcement published!');
//       }
//     } catch (error) {
//       console.error('Failed to publish announcement:', error);
//     } finally {
//       setIsPublishing(false);
//     }
//   }

//   async function addStaff() {
//     const res = await fetch(`/api/hackathons/${hackathonId}/staff`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email: staffEmail, type: staffType }),
//     });
//     const data = await res.json();
//     if (res.ok) {
//       setStaff({ judges: data.data.judges, mentors: data.data.mentors });
//       setFeedback(`${staffType.toLowerCase()} added successfully`);
//       setStaffEmail('');
//     } else {
//       setFeedback(data.error || 'Failed to add staff');
//     }
//   }

//   async function saveHackathonControls() {
//     const res = await fetch(`/api/hackathons/${hackathonId}`, {
//       method: 'PUT',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ status: statusControl, maxTeams }),
//     });
//     const data = await res.json();
//     setFeedback(res.ok ? 'Hackathon controls updated' : data.error || 'Failed to update');
//   }

//   async function createRubric() {
//     const res = await fetch(`/api/hackathons/${hackathonId}/rubrics`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(rubric),
//     });
//     const data = await res.json();
//     setFeedback(res.ok ? 'Rubric created' : data.error || 'Failed to create rubric');
//   }

//   async function runQuickAction(action: 'LOCK_SUBMISSIONS' | 'EXTEND_DEADLINE' | 'OPEN_JUDGING') {
//     const payload: any = { action };
//     if (action === 'EXTEND_DEADLINE') payload.submissionDeadline = extendDeadline;
//     const res = await fetch(`/api/hackathons/${hackathonId}/quick-actions`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });
//     const data = await res.json();
//     setFeedback(res.ok ? `${action} applied` : data.error || 'Quick action failed');
//   }

//   async function updateJudgingControl(next: { judgingOpen?: boolean; blindMode?: boolean }) {
//     const res = await fetch(`/api/hackathons/${hackathonId}/judging-control`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(next),
//     });
//     const data = await res.json();
//     setFeedback(res.ok ? 'Judging control updated' : data.error || 'Judging control failed');
//     if (res.ok) setJudgingControl((prev) => ({ ...prev, ...next }));
//   }

//   async function generateCertificate() {
//     const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ userId: certificateUserId, type: certificateType }),
//     });
//     const data = await res.json();
//     setFeedback(res.ok ? `Certificate generated: ${data.data.certificateUrl || data.data.id}` : data.error || 'Certificate generation failed');
//   }

//   async function saveTimelineEvent() {
//     const isEdit = !!timelineForm.id;
//     const url = isEdit
//       ? `/api/hackathons/${hackathonId}/timeline/${timelineForm.id}`
//       : `/api/hackathons/${hackathonId}/timeline`;
//     const method = isEdit ? 'PUT' : 'POST';
//     const payload = {
//       title: timelineForm.title,
//       description: timelineForm.description,
//       type: timelineForm.type,
//       startTime: new Date(timelineForm.startTime).toISOString(),
//       endTime: new Date(timelineForm.endTime).toISOString(),
//     };
//     const res = await fetch(url, {
//       method,
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(payload),
//     });
//     const data = await res.json();
//     if (!res.ok) {
//       setFeedback(data.error || 'Failed to save timeline event');
//       return;
//     }
//     setFeedback(isEdit ? 'Timeline event updated' : 'Timeline event created');
//     setTimelineForm({ id: '', title: '', description: '', type: 'general', startTime: '', endTime: '' });
//     const listRes = await fetch(`/api/hackathons/${hackathonId}/timeline`);
//     const listData = await listRes.json();
//     setTimelineEvents(listData.data || []);
//   }

//   if (isLoading) {
//     return (
//       <div className="p-8 flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-8">
//       <h1 className="text-4xl font-bold text-gray-900 mb-8">Command Center</h1>
//       {feedback && <div className="mb-4 p-3 rounded bg-indigo-100 text-indigo-800">{feedback}</div>}

//       {/* Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
//         <div className="card">
//           <p className="text-gray-600 text-sm">Total Teams</p>
//           <p className="text-3xl font-bold text-gray-900">{stats?.totalTeams}</p>
//         </div>
//         <div className="card">
//           <p className="text-gray-600 text-sm">Submissions</p>
//           <p className="text-3xl font-bold text-gray-900">{stats?.submittedCount}</p>
//         </div>
//         <div className="card">
//           <p className="text-gray-600 text-sm">Participants</p>
//           <p className="text-3xl font-bold text-gray-900">{stats?.participantsCount}</p>
//         </div>
//         <div className="card">
//           <p className="text-gray-600 text-sm">Healthy Submissions</p>
//           <p className="text-3xl font-bold text-gray-900">{stats?.healthyCount}</p>
//         </div>
//         <div className="card">
//           <p className="text-gray-600 text-sm">Avg Team Size</p>
//           <p className="text-3xl font-bold text-gray-900">{stats?.averageTeamSize}</p>
//         </div>
//         <div className="card">
//           <p className="text-gray-600 text-sm">Open Tickets</p>
//           <p className="text-3xl font-bold text-gray-900">{stats?.openTickets}</p>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-6 mb-8">
//         <div className="card">
//           <h2 className="text-xl font-bold mb-3">Team Distribution Chart</h2>
//           <div className="space-y-2">
//             {Object.entries(stats?.teamDistribution || {}).map(([size, count]) => (
//               <div key={size} className="flex items-center gap-3">
//                 <span className="w-16 text-sm">Size {size}</span>
//                 <div className="h-3 bg-indigo-500 rounded" style={{ width: `${Math.max(8, Number(count) * 18)}px` }} />
//                 <span className="text-sm">{count}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="card">
//           <h2 className="text-xl font-bold mb-3">Skill Heatmap</h2>
//           <div className="grid grid-cols-2 gap-2">
//             {(stats?.skillHeatmap || []).map((s) => (
//               <div key={s.skill} className="p-2 rounded bg-indigo-50 flex justify-between">
//                 <span>{s.skill}</span>
//                 <span className="font-semibold">{s.count}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-6">
//         {/* Announcement Panel */}
//         <div className="col-span-2">
//           <div className="card mb-6">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Publish Announcement</h2>
//             <div className="space-y-4">
//               <input
//                 type="text"
//                 placeholder="Title"
//                 value={newAnnouncement.title}
//                 onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
//                 className="input"
//               />
//               <textarea
//                 placeholder="Content"
//                 value={newAnnouncement.content}
//                 onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
//                 className="input min-h-24"
//               />
//               <select
//                 value={announcementChannel}
//                 onChange={(e) => setAnnouncementChannel(e.target.value)}
//                 className="input"
//               >
//                 <option value="website">website</option>
//                 <option value="discord">discord</option>
//                 <option value="both">both</option>
//               </select>
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={newAnnouncement.isUrgent}
//                   onChange={(e) => setNewAnnouncement({ ...newAnnouncement, isUrgent: e.target.checked })}
//                   id="urgent"
//                 />
//                 <label htmlFor="urgent" className="text-gray-700">
//                   Mark as urgent
//                 </label>
//               </div>
//               <button
//                 onClick={handlePublishAnnouncement}
//                 disabled={isPublishing}
//                 className="btn btn-primary w-full"
//               >
//                 {isPublishing ? 'Publishing...' : 'Publish'}
//               </button>
//             </div>
//           </div>

//           {/* Recent Announcements */}
//           <div className="card">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Announcements</h2>
//             <div className="space-y-4 max-h-96 overflow-y-auto">
//               {announcements.map((announcement) => (
//                 <div key={announcement.id} className="p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-start justify-between mb-2">
//                     <h3 className="font-bold text-gray-900">{announcement.title}</h3>
//                     {announcement.isUrgent && (
//                       <span className="badge badge-danger">URGENT</span>
//                     )}
//                   </div>
//                   <p className="text-gray-700 text-sm mb-2">{announcement.content}</p>
//                   <p className="text-xs text-gray-600">
//                     by {announcement.author.name} •{' '}
//                     {new Date(announcement.createdAt).toLocaleString()}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="card mt-6">
//             <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Monitoring</h2>
//             <div className="overflow-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="text-left border-b">
//                     <th className="py-2">Team</th>
//                     <th>Status</th>
//                     <th>GitHub</th>
//                     <th>Live</th>
//                     <th>Health</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {submissions.map((s) => (
//                     <tr key={s.id} className="border-b">
//                       <td className="py-2">{s.team?.name}</td>
//                       <td>{s.status}</td>
//                       <td>{s.githubUrl ? <a className="text-indigo-600" href={s.githubUrl} target="_blank">link</a> : '-'}</td>
//                       <td>{s.liveUrl ? <a className="text-indigo-600" href={s.liveUrl} target="_blank">link</a> : '-'}</td>
//                       <td>{s.isHealthy ? 'healthy' : s.healthCheckAt ? 'broken' : 'checking'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>

//           <div className="card mt-6">
//             <h2 className="text-xl font-bold mb-3">Team Monitoring</h2>
//             <div className="space-y-2 max-h-72 overflow-auto">
//               {teams.map((t) => (
//                 <div key={t.id} className="p-3 rounded border">
//                   <p className="font-semibold">{t.name}</p>
//                   <p className="text-sm text-gray-600">Members: {t.members?.length || 0}</p>
//                   <p className="text-xs text-gray-500">
//                     {t.members?.map((m: any) => m.user.name).join(', ')}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="card mt-6">
//             <h2 className="text-xl font-bold mb-4">Timeline Events</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//               <input
//                 className="input"
//                 placeholder="Event title"
//                 value={timelineForm.title}
//                 onChange={(e) => setTimelineForm((p) => ({ ...p, title: e.target.value }))}
//               />
//               <input
//                 className="input"
//                 placeholder="Event type"
//                 value={timelineForm.type}
//                 onChange={(e) => setTimelineForm((p) => ({ ...p, type: e.target.value }))}
//               />
//               <input
//                 className="input"
//                 placeholder="Description"
//                 value={timelineForm.description}
//                 onChange={(e) => setTimelineForm((p) => ({ ...p, description: e.target.value }))}
//               />
//               <div />
//               <input
//                 type="datetime-local"
//                 className="input"
//                 value={timelineForm.startTime}
//                 onChange={(e) => setTimelineForm((p) => ({ ...p, startTime: e.target.value }))}
//               />
//               <input
//                 type="datetime-local"
//                 className="input"
//                 value={timelineForm.endTime}
//                 onChange={(e) => setTimelineForm((p) => ({ ...p, endTime: e.target.value }))}
//               />
//             </div>
//             <button className="btn btn-primary mb-4" onClick={saveTimelineEvent}>
//               {timelineForm.id ? 'Update Event' : 'Add Event'}
//             </button>
//             <div className="space-y-2 max-h-72 overflow-auto">
//               {timelineEvents.map((ev) => (
//                 <div key={ev.id} className="p-3 border rounded flex justify-between items-center">
//                   <div>
//                     <p className="font-semibold">{ev.title}</p>
//                     <p className="text-sm text-gray-600">
//                       {new Date(ev.startTime).toLocaleString()} - {new Date(ev.endTime).toLocaleString()}
//                     </p>
//                     <p className="text-xs text-gray-500">{ev.type}</p>
//                   </div>
//                   <button
//                     className="btn btn-secondary"
//                     onClick={() =>
//                       setTimelineForm({
//                         id: ev.id,
//                         title: ev.title || '',
//                         description: ev.description || '',
//                         type: ev.type || 'general',
//                         startTime: new Date(ev.startTime).toISOString().slice(0, 16),
//                         endTime: new Date(ev.endTime).toISOString().slice(0, 16),
//                       })
//                     }
//                   >
//                     Edit
//                   </button>
//                 </div>
//               ))}
//               {timelineEvents.length === 0 && <p className="text-sm text-gray-600">No timeline events yet.</p>}
//             </div>
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div className="col-span-1">
//           <div className="card space-y-4">
//             <h2 className="text-xl font-bold text-gray-900">Hackathon Management</h2>
//             <select className="input" value={statusControl} onChange={(e) => setStatusControl(e.target.value)}>
//               <option value="draft">draft</option>
//               <option value="published">published</option>
//               <option value="ongoing">ongoing</option>
//               <option value="judging">judging</option>
//               <option value="ended">ended</option>
//             </select>
//             <input className="input" type="number" value={maxTeams} onChange={(e) => setMaxTeams(parseInt(e.target.value || '0', 10))} placeholder="max teams" />
//             <button className="btn btn-secondary w-full" onClick={saveHackathonControls}>Save Controls</button>

//             <h3 className="text-lg font-bold pt-3 border-t">Staff Management</h3>
//             <input className="input" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="user email" />
//             <select className="input" value={staffType} onChange={(e) => setStaffType(e.target.value as any)}>
//               <option value="JUDGE">Judge</option>
//               <option value="MENTOR">Mentor</option>
//             </select>
//             <button className="btn btn-secondary w-full" onClick={addStaff}>Add Staff</button>
//             <p className="text-xs">Judges: {staff.judges.length} | Mentors: {staff.mentors.length}</p>

//             <h3 className="text-lg font-bold pt-3 border-t">Judging Control</h3>
//             <button className="btn btn-secondary w-full" onClick={() => updateJudgingControl({ judgingOpen: !judgingControl.judgingOpen })}>
//               {judgingControl.judgingOpen ? 'Close Round' : 'Open Round'}
//             </button>
//             <button className="btn btn-secondary w-full" onClick={() => updateJudgingControl({ blindMode: !judgingControl.blindMode })}>
//               {judgingControl.blindMode ? 'Disable Blind Mode' : 'Enable Blind Mode'}
//             </button>

//             <h3 className="text-lg font-bold pt-3 border-t">Rubric</h3>
//             <button className="btn btn-secondary w-full" onClick={createRubric}>Create Default Rubric</button>

//             <h3 className="text-lg font-bold pt-3 border-t">Quick Actions</h3>
//             <button className="btn btn-secondary w-full" onClick={() => runQuickAction('LOCK_SUBMISSIONS')}>Lock Submissions</button>
//             <input className="input" type="datetime-local" value={extendDeadline} onChange={(e) => setExtendDeadline(e.target.value)} />
//             <button className="btn btn-secondary w-full" onClick={() => runQuickAction('EXTEND_DEADLINE')}>Extend Deadline</button>
//             <button className="btn btn-secondary w-full" onClick={() => runQuickAction('OPEN_JUDGING')}>Open Judging</button>

//             <h3 className="text-lg font-bold pt-3 border-t">Certificate System</h3>
//             <input className="input" value={certificateUserId} onChange={(e) => setCertificateUserId(e.target.value)} placeholder="user id" />
//             <select className="input" value={certificateType} onChange={(e) => setCertificateType(e.target.value)}>
//               <option value="PARTICIPANT">participant</option>
//               <option value="WINNER">winner</option>
//               <option value="RUNNER_UP">runner_up</option>
//               <option value="BEST_PROJECT">best_project</option>
//             </select>
//             <button className="btn btn-secondary w-full" onClick={generateCertificate}>Generate Certificate</button>
            
//             <div>
//               <p className="text-sm text-gray-600">Attendance</p>
//               <p className="text-2xl font-bold text-gray-900">{stats?.totalAttendances}</p>
//             </div>

//             <div>
//               <p className="text-sm text-gray-600">Average Score</p>
//               <p className="text-2xl font-bold text-gray-900">{stats?.averageScore.toFixed(1)}</p>
//             </div>

//             <div>
//               <p className="text-sm text-gray-600">Total Scores</p>
//               <p className="text-2xl font-bold text-gray-900">{stats?.totalScores}</p>
//             </div>

//             <div className="pt-4 border-t">
//               <p className="text-xs text-gray-600">Last updated: {new Date().toLocaleTimeString()}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EditHackathonModal from '@/components/organiser/EditHackathonModal';

interface HackathonData {
  id: string;
  title: string;
  tagline?: string;
  description: string;
  shortDescription: string;
  bannerUrl?: string;
  logoUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  isVirtual: boolean;
  location?: string;
  maxTeamSize: number;
  minTeamSize: number;
  prize?: string;
  rules?: string;
  hostName?: string;
  contactEmail?: string;
  theme?: string;
  eligibilityDomain?: string;
  status: string;
  breakfastProvided?: boolean;
  lunchProvided?: boolean;
  dinnerProvided?: boolean;
  swagProvided?: boolean;
  allowCrossYearTeams?: boolean;
  themedTracks?: string[];
  targetBatches?: string[];
  allowedDepartments?: string[];
  submissionRequirements?: string[];
  sponsorDetails?: any[];
  judgeDetails?: any[];
  mentorDetails?: any[];
  mealSchedule?: any[];
  rubricItems?: any[];
  internalMentors?: any[];
}

interface Stats {
  totalTeams: number;
  participantsCount: number;
  totalSubmissions: number;
  submittedCount: number;
  healthyCount: number;
  openTickets: number;
  totalAttendances: number;
  averageTeamSize: number;
  averageScore: number;
  totalScores: number;
  teamDistribution: Record<string, number>;
  skillHeatmap: Array<{ skill: string; count: number }>;
  trends: {
    timestamp: string;
    teamCount: number;
    submissionCount: number;
    openTickets: number;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: { id: string; name: string };
  isUrgent: boolean;
  createdAt: string;
}

const TRACK_NAMES: Record<string, string> = {
  'ai-ml': 'AI / ML',
  'web3': 'Web3 & Blockchain',
  'fintech': 'FinTech',
  'healthtech': 'HealthTech',
  'edtech': 'EdTech',
  'cleantech': 'CleanTech',
  'iot': 'IoT & Hardware',
  'gaming': 'Gaming',
  'social': 'Social Impact',
  'open': 'Open Innovation',
};

const TRACK_ICONS: Record<string, string> = {
  'ai-ml': '🤖', 'web3': '⛓️', 'fintech': '💰', 'healthtech': '🏥',
  'edtech': '📚', 'cleantech': '🌱', 'iot': '📡', 'gaming': '🎮',
  'social': '🤝', 'open': '🔓',
};

const SUBMISSION_LABELS: Record<string, string> = {
  'github': 'GitHub Repository',
  'demo': 'Live Demo Link',
  'video': 'Video Pitch',
  'presentation': 'Presentation PDF',
  'readme': 'README Documentation',
  'demo-video': 'Demo Video',
};

const STAT_CARDS = [
  { key: 'totalTeams',      label: 'Total Teams',    color: '#6366f1' },
  { key: 'submittedCount',  label: 'Submissions',    color: '#0ea5e9' },
  { key: 'participantsCount', label: 'Participants', color: '#10b981' },
  { key: 'healthyCount',    label: 'Healthy Subs',   color: '#8b5cf6' },
  { key: 'averageTeamSize', label: 'Avg Team Size',  color: '#f59e0b' },
  { key: 'openTickets',     label: 'Open Tickets',   color: '#ef4444' },
];

export default function CommandCenterPage() {
  const params = useParams();
  const hackathonId = params.hackathonId as string;
  const [stats, setStats] = useState<Stats | null>(null);
  const [hackathonData, setHackathonData] = useState<HackathonData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', isUrgent: false });
  const [announcementChannel, setAnnouncementChannel] = useState('website');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineForm, setTimelineForm] = useState({
    id: '', title: '', description: '', type: 'general', startTime: '', endTime: '',
  });
  const [staffEmail, setStaffEmail] = useState('');
  const [staffType, setStaffType] = useState<'JUDGE' | 'MENTOR'>('JUDGE');
  const [staff, setStaff] = useState<{ judges: any[]; mentors: any[] }>({ judges: [], mentors: [] });
  const [staffLoading, setStaffLoading] = useState(false);
  const [rubric] = useState({
    name: 'Main Rubric', description: '', maxScore: 100,
    items: [
      { name: 'Innovation', weight: 40, maxScore: 10 },
      { name: 'Execution', weight: 30, maxScore: 10 },
      { name: 'Impact', weight: 30, maxScore: 10 },
    ],
  });
  const [statusControl, setStatusControl] = useState('draft');
  const [maxTeams, setMaxTeams] = useState(100);
  const [extendDeadline, setExtendDeadline] = useState('');
  const [judgingControl, setJudgingControl] = useState({ judgingOpen: false, blindMode: false });
  const [certificateUserId, setCertificateUserId] = useState('');
  const [certificateType, setCertificateType] = useState('PARTICIPANT');
  const [rankings, setRankings] = useState<any[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [autoCertLoading, setAutoCertLoading] = useState(false);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingControls, setIsSavingControls] = useState(false);
  const [isPublishingHackathon, setIsPublishingHackathon] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState<'monitor' | 'manage' | 'comms' | 'controls' | 'certificates'>('monitor');

  const showFeedback = (message: string) => {
    setFeedback(message);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, announcementsRes, submissionsRes, hackathonRes, staffRes, judgingRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}/stats`),
          fetch(`/api/hackathons/${hackathonId}/announcements?limit=5`),
          fetch(`/api/hackathons/${hackathonId}/submissions`),
          fetch(`/api/hackathons/${hackathonId}`),
          fetch(`/api/hackathons/${hackathonId}/staff`),
          fetch(`/api/hackathons/${hackathonId}/judging-control`),
        ]);
        const [statsData, announcementsData, submissionsData, hackathonData, staffData, judgingData] = await Promise.all([
          statsRes.json(), announcementsRes.json(), submissionsRes.json(),
          hackathonRes.json(), staffRes.json(), judgingRes.json(),
        ]);
        setStats(statsData.data);
        setAnnouncements(announcementsData.data || []);
        setSubmissions(submissionsData.data || []);
        setHackathonData(hackathonData.data);
        setTeams(hackathonData.data?.teams || []);
        setTimelineEvents(hackathonData.data?.timelines || []);
        setStaff({ judges: staffData.data?.judges || [], mentors: staffData.data?.mentors || [] });
        setJudgingControl({ judgingOpen: !!judgingData.data?.judgingOpen, blindMode: !!judgingData.data?.blindMode });

        setRankingsLoading(true);
        try {
          const rankingsRes = await fetch(`/api/hackathons/${hackathonId}/rankings`);
          const rankingsData = await rankingsRes.json();
          setRankings(rankingsData.data || []);
        } finally {
          setRankingsLoading(false);
        }

        setCertificatesLoading(true);
        try {
          const certRes = await fetch(`/api/hackathons/${hackathonId}/certificates`);
          const certData = await certRes.json();
          setCertificates(certData.data || []);
        } finally {
          setCertificatesLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    if (hackathonId) fetchData();
  }, [hackathonId]);

  async function handlePublishAnnouncement() {
    if (!newAnnouncement.title || !newAnnouncement.content) { alert('Please fill in all fields'); return; }
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/announcements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAnnouncement, channel: announcementChannel }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements([data.data, ...announcements]);
        setNewAnnouncement({ title: '', content: '', isUrgent: false });
        showFeedback('Announcement published successfully');
      }
    } catch (error) { console.error('Failed to publish announcement:', error); }
    finally { setIsPublishing(false); }
  }

  async function addStaff() {
    const res = await fetch(`/api/hackathons/${hackathonId}/staff`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffEmail, type: staffType }),
    });
    const data = await res.json();
    if (res.ok) { setStaff({ judges: data.data.judges, mentors: data.data.mentors }); showFeedback(`${staffType.toLowerCase()} added successfully`); setStaffEmail(''); }
    else showFeedback(data.error || 'Failed to add staff');
  }

  async function sendStaffInvite() {
    if (!staffEmail.trim()) { showFeedback('Enter an email to send an invite'); return; }
    setStaffLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffEmail, role: staffType }),
      });
      const data = await res.json();
      if (res.ok) { showFeedback(`${staffType.toLowerCase()} invite sent`); setStaffEmail(''); }
      else showFeedback(data.error || 'Failed to send invite');
    } catch (error) { showFeedback('Failed to send invite'); }
    finally { setStaffLoading(false); }
  }

  async function autoAssignMentors() {
    setStaffLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff/auto-assign`, { method: 'POST' });
      const data = await res.json();
      showFeedback(res.ok ? data.message || 'Mentors auto-assigned' : data.error || 'Auto-assign failed');
    } catch { showFeedback('Auto-assign failed'); }
    finally { setStaffLoading(false); }
  }

  async function saveHackathonControls() {
    setIsSavingControls(true);
    const res = await fetch(`/api/hackathons/${hackathonId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusControl, maxTeams }),
    });
    const data = await res.json();
    showFeedback(res.ok ? 'Hackathon controls updated' : data.error || 'Failed to update');
    setIsSavingControls(false);
  }

  async function publishHackathon() {
    setIsPublishingHackathon(true);
    const res = await fetch(`/api/hackathons/${hackathonId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusControl('published');
      showFeedback('Hackathon published');
    } else {
      showFeedback(data.error || 'Failed to publish');
    }
    setIsPublishingHackathon(false);
  }

  async function createRubric() {
    const res = await fetch(`/api/hackathons/${hackathonId}/rubrics`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rubric),
    });
    const data = await res.json();
    showFeedback(res.ok ? 'Rubric created' : data.error || 'Failed to create rubric');
  }

  async function runQuickAction(action: 'LOCK_SUBMISSIONS' | 'EXTEND_DEADLINE' | 'OPEN_JUDGING') {
    const payload: any = { action };
    if (action === 'EXTEND_DEADLINE') payload.submissionDeadline = extendDeadline;
    const res = await fetch(`/api/hackathons/${hackathonId}/quick-actions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    showFeedback(res.ok ? `${action.replace(/_/g, ' ')} applied` : data.error || 'Quick action failed');
  }

  async function updateJudgingControl(next: { judgingOpen?: boolean; blindMode?: boolean }) {
    const res = await fetch(`/api/hackathons/${hackathonId}/judging-control`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    const data = await res.json();
    showFeedback(res.ok ? 'Judging control updated' : data.error || 'Judging control failed');
    if (res.ok) setJudgingControl((prev) => ({ ...prev, ...next }));
  }

  async function generateCertificate() {
    const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: certificateUserId, type: certificateType }),
    });
    const data = await res.json();
    showFeedback(res.ok ? `Certificate generated: ${data.data.certificateUrl || data.data.id}` : data.error || 'Certificate generation failed');
  }

  async function autoGenerateCertificates() {
    setAutoCertLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'auto' }),
      });
      const data = await res.json();
      showFeedback(res.ok ? data.message || 'Certificates generated' : data.error || 'Certificate generation failed');
    } finally {
      setAutoCertLoading(false);
    }
  }

  async function saveTimelineEvent() {
    const isEdit = !!timelineForm.id;
    const url = isEdit ? `/api/hackathons/${hackathonId}/timeline/${timelineForm.id}` : `/api/hackathons/${hackathonId}/timeline`;
    const payload = { title: timelineForm.title, description: timelineForm.description, type: timelineForm.type, startTime: new Date(timelineForm.startTime).toISOString(), endTime: new Date(timelineForm.endTime).toISOString() };
    const res = await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { showFeedback(data.error || 'Failed to save timeline event'); return; }
    showFeedback(isEdit ? 'Timeline event updated' : 'Timeline event created');
    setTimelineForm({ id: '', title: '', description: '', type: 'general', startTime: '', endTime: '' });
    const listRes = await fetch(`/api/hackathons/${hackathonId}/timeline`);
    const listData = await listRes.json();
    setTimelineEvents(listData.data || []);
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6366f1', marginTop: 16, fontFamily: '"DM Mono", monospace', fontSize: 12, letterSpacing: 2 }}>INITIALIZING...</p>
      </div>
    );
  }

  const maxDistribution = Math.max(...Object.values(stats?.teamDistribution || { _: 1 }).map(Number), 1);
  const maxSkill = Math.max(...(stats?.skillHeatmap || [{ count: 1 }]).map((s) => s.count), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f1f5f9; }

        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .cc-input {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          color: #1e293b;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 9px 12px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cc-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .cc-input::placeholder { color: #94a3b8; }
        textarea.cc-input { resize: vertical; min-height: 80px; }

        .cc-select {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          color: #1e293b;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          padding: 9px 12px;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236366f1' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cc-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .cc-btn {
          width: 100%;
          padding: 9px 16px;
          border-radius: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.5px;
          cursor: pointer;
          border: 1.5px solid;
          transition: all 0.15s;
          font-weight: 500;
        }
        .cc-btn-primary {
          background: #6366f1;
          border-color: #6366f1;
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(99,102,241,0.3);
        }
        .cc-btn-primary:hover { background: #4f46e5; border-color: #4f46e5; box-shadow: 0 4px 12px rgba(99,102,241,0.35); }
        .cc-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .cc-btn-secondary {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #475569;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .cc-btn-secondary:hover { border-color: #6366f1; color: #6366f1; background: #fafafa; }
        .cc-btn-ghost {
          background: transparent;
          border-color: transparent;
          color: #94a3b8;
          padding: 6px 12px;
        }
        .cc-btn-ghost:hover { color: #6366f1; border-color: #e2e8f0; background: #f8fafc; }
        .cc-btn-danger {
          background: #ffffff;
          border-color: #fecaca;
          color: #ef4444;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .cc-btn-danger:hover { background: #fef2f2; border-color: #ef4444; }

        .tab-btn {
          background: none;
          border: none;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.8px;
          padding: 10px 20px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          color: #94a3b8;
        }
        .tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
        .tab-btn:hover:not(.active) { color: #475569; }

        .toggle-track {
          width: 36px; height: 20px;
          border-radius: 10px;
          transition: background 0.2s;
          position: relative;
          flex-shrink: 0;
          cursor: pointer;
        }
        .toggle-thumb {
          position: absolute;
          top: 3px; left: 3px;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: white;
          transition: transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 20px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.3px;
          font-weight: 500;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
        }

        .section-label {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #f1f5f9;
        }

        .card-cc {
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03);
        }

        .nav-btn-hover:hover {
          background: #f8fafc;
          color: #1e293b;
        }

        .cc-hackathon-preview {
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cc-preview-banner {
          width: 100%;
          height: 100px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .cc-preview-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cc-preview-logo {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1.5px solid #e2e8f0;
        }
        .cc-preview-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cc-preview-info { flex: 1; min-width: 0; }
        .cc-preview-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .cc-preview-tagline {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }
        .cc-preview-meta {
          display: flex;
          gap: 16px;
          margin-top: 6px;
        }
        .cc-preview-meta-item {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: #94a3b8;
          letter-spacing: 0.3px;
        }
        .cc-preview-meta-item span {
          color: #1e293b;
          font-weight: 500;
        }
        .cc-edit-btn {
          padding: 8px 16px;
          border-radius: 8px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #6366f1;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.15s;
          font-weight: 500;
          white-space: nowrap;
        }
        .cc-edit-btn:hover {
          background: #eef2ff;
          border-color: #c7d2fe;
        }

        .cc-quick-stat {
          background: #ffffff;
          border: 1.5px solid #f1f5f9;
          border-radius: 10px;
          padding: 14px 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .cc-quick-stat-label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .cc-quick-stat-value {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 22px;
          font-weight: 500;
        }

        .cc-zone-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .cc-zone-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .cc-zone-title {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .cc-zone-desc {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 1px;
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: '"DM Sans", sans-serif' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, background: '#ffffff', borderRight: '1.5px solid #f1f5f9',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}>
          {/* Logo */}
          <div style={{ padding: '20px 18px', borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#6366f1', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="7" height="7" rx="1.5" fill="white" />
                  <rect x="10" y="1" width="7" height="7" rx="1.5" fill="white" opacity="0.6" />
                  <rect x="1" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.6" />
                  <rect x="10" y="10" width="7" height="7" rx="1.5" fill="white" opacity="0.3" />
                </svg>
              </div>
              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, letterSpacing: 1.5, color: '#1e293b', fontWeight: 500 }}>CMD CENTER</span>
            </div>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite', boxShadow: '0 0 0 2px #d1fae5' }} />
          </div>

          {/* Nav */}
          <nav style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { id: 'monitor', icon: '◈', label: 'Monitor' },
              { id: 'manage',  icon: '◇', label: 'Manage' },
              { id: 'comms',   icon: '◉', label: 'Comms' },
              { id: 'controls',icon: '◎', label: 'Controls' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className="nav-btn-hover"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8, border: 'none',
                  background: activeTab === item.id ? '#eef2ff' : 'none',
                  cursor: 'pointer',
                  fontFamily: '"DM Mono", monospace', fontSize: 11, letterSpacing: 0.5,
                  color: activeTab === item.id ? '#6366f1' : '#64748b',
                  transition: 'all 0.15s', textAlign: 'left',
                  fontWeight: activeTab === item.id ? 500 : 400,
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Stats */}
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1.5px solid #f1f5f9', borderBottom: '1.5px solid #f1f5f9' }}>
            {STAT_CARDS.map((card) => (
              <div key={card.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: 1 }}>{card.label.toUpperCase()}</span>
                <span style={{ color: card.color, fontFamily: '"DM Mono", monospace', fontSize: 16, fontWeight: 500 }}>
                  {card.key === 'averageTeamSize'
                    ? (stats as any)?.[card.key]?.toFixed(1) ?? '—'
                    : (stats as any)?.[card.key] ?? '—'}
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1.5px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: 1 }}>ATTENDANCE</span>
              <span style={{ color: '#f59e0b', fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 500 }}>{stats?.totalAttendances ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <span style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: 1 }}>AVG SCORE</span>
              <span style={{ color: '#8b5cf6', fontFamily: '"DM Mono", monospace', fontSize: 14, fontWeight: 500 }}>{stats?.averageScore?.toFixed(1) ?? '—'}</span>
            </div>
            <p style={{ color: '#e2e8f0', fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: 1, marginTop: 14 }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} LOCAL
            </p>
          </div>
        </aside>

        {/* ── Main ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>

          {/* Top bar */}
          <header style={{
            padding: '18px 28px', borderBottom: '1.5px solid #f1f5f9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12,
            background: '#ffffff',
            position: 'sticky', top: 0, zIndex: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div>
              <h1 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: -0.5 }}>
                Command Center
              </h1>
              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                {hackathonData?.title || 'Loading...'} · <span style={{ color: '#6366f1' }}>{hackathonId}</span>
              </p>
            </div>

            <div style={{ display: 'flex', borderBottom: 'none', gap: 0, alignItems: 'center' }}>
              {(['monitor', 'manage', 'comms', 'controls', 'certificates'] as const).map((t) => (
                <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                  {t.toUpperCase()}
                </button>
              ))}
              <a
                href={`/participant/hackathons/${hackathonId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 8,
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 10,
                  letterSpacing: 0.5,
                  color: '#6366f1',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#eef2ff';
                  e.currentTarget.style.borderColor = '#c7d2fe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                ↗ VIEW PUBLIC PAGE
              </a>
            </div>

            {feedback && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px',
                background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                borderRadius: 8, fontFamily: '"DM Mono", monospace',
                fontSize: 11, color: '#16a34a', animation: 'fadeSlideIn 0.3s ease', letterSpacing: 0.3,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                {feedback}
              </div>
            )}
          </header>

          <div style={{ padding: '28px', flex: 1, overflowY: 'auto' }}>

            {/* ── MANAGE TAB ── */}
            {activeTab === 'manage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Hackathon Preview with Edit Button */}
                <div className="cc-hackathon-preview">
                  {hackathonData?.bannerUrl && (
                    <div className="cc-preview-banner">
                      <img src={hackathonData.bannerUrl} alt="Banner" />
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {hackathonData?.logoUrl && (
                      <div className="cc-preview-logo">
                        <img src={hackathonData.logoUrl} alt="Logo" />
                      </div>
                    )}
                    <div className="cc-preview-info" style={{ flex: 1 }}>
                      <h3 className="cc-preview-title">{hackathonData?.title || 'Loading...'}</h3>
                      <p className="cc-preview-tagline">{hackathonData?.tagline || hackathonData?.shortDescription}</p>
                      <div className="cc-preview-meta">
                        <span className="cc-preview-meta-item">
                          Status: <span>{hackathonData?.status}</span>
                        </span>
                        <span className="cc-preview-meta-item">
                          Dates: <span>{hackathonData?.startDate ? new Date(hackathonData.startDate).toLocaleDateString() : '—'}</span>
                        </span>
                      </div>
                    </div>
                    <button className="cc-edit-btn" onClick={() => setShowEditModal(true)} style={{ flexShrink: 0 }}>
                      ✎ EDIT DETAILS
                    </button>
                  </div>
                </div>

                {/* Zone A: Stats Overview */}
                <div>
                  <div className="cc-zone-header">
                    <div className="cc-zone-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>◈</div>
                    <div>
                      <h3 className="cc-zone-title">Overview</h3>
                      <p className="cc-zone-desc">Key metrics at a glance</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                    <div className="cc-quick-stat">
                      <span className="cc-quick-stat-label">Teams</span>
                      <span className="cc-quick-stat-value" style={{ color: '#6366f1' }}>{stats?.totalTeams ?? 0}</span>
                    </div>
                    <div className="cc-quick-stat">
                      <span className="cc-quick-stat-label">Participants</span>
                      <span className="cc-quick-stat-value" style={{ color: '#10b981' }}>{stats?.participantsCount ?? 0}</span>
                    </div>
                    <div className="cc-quick-stat">
                      <span className="cc-quick-stat-label">Submissions</span>
                      <span className="cc-quick-stat-value" style={{ color: '#0ea5e9' }}>{stats?.submittedCount ?? 0}</span>
                    </div>
                    <div className="cc-quick-stat">
                      <span className="cc-quick-stat-label">Judges</span>
                      <span className="cc-quick-stat-value" style={{ color: '#8b5cf6' }}>{staff.judges.length}</span>
                    </div>
                    <div className="cc-quick-stat">
                      <span className="cc-quick-stat-label">Mentors</span>
                      <span className="cc-quick-stat-value" style={{ color: '#f59e0b' }}>{staff.mentors.length}</span>
                    </div>
                    <div className="cc-quick-stat">
                      <span className="cc-quick-stat-label">Avg Score</span>
                      <span className="cc-quick-stat-value" style={{ color: '#ec4899' }}>{stats?.averageScore?.toFixed(1) ?? '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Zone B: Hackathon Management */}
                <div>
                  <div className="cc-zone-header">
                    <div className="cc-zone-icon" style={{ background: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>⚙</div>
                    <div>
                      <h3 className="cc-zone-title">Management</h3>
                      <p className="cc-zone-desc">Edit details, manage timeline, control settings</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {/* Quick Edit Card */}
                    <div className="card-cc">
                      <p className="section-label">Hackathon Details</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Title', value: hackathonData?.title },
                          { label: 'Tagline', value: hackathonData?.tagline },
                          { label: 'Short Desc', value: hackathonData?.shortDescription },
                          { label: 'Theme', value: hackathonData?.theme },
                          { label: 'Format', value: hackathonData?.isVirtual ? 'Virtual' : 'In-Person' },
                          { label: 'Venue / Location', value: hackathonData?.location },
                          { label: 'Team Size', value: hackathonData ? `${hackathonData.minTeamSize}–${hackathonData.maxTeamSize} members` : null },
                          { label: 'Prize Pool', value: hackathonData?.prize },
                          { label: 'Host', value: hackathonData?.hostName },
                          { label: 'Contact', value: hackathonData?.contactEmail },
                        ].filter(item => item.value).map((item) => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 10px', background: '#f8fafc', borderRadius: 6, gap: 8 }}>
                            <span style={{ fontSize: 11, color: '#64748b', fontFamily: '"DM Mono", monospace', flexShrink: 0 }}>{item.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#1e293b', textAlign: 'right', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</span>
                          </div>
                        ))}
                        <button className="cc-btn cc-btn-primary" onClick={() => setShowEditModal(true)} style={{ marginTop: 4 }}>
                          ✎ EDIT ALL DETAILS
                        </button>
                      </div>
                    </div>

                    {/* Schedule Card */}
                    <div className="card-cc">
                      <p className="section-label">Schedule</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {hackathonData && [
                          { label: 'Registration Deadline', value: hackathonData.registrationDeadline, color: '#3b82f6' },
                          { label: 'Hackathon Start', value: hackathonData.startDate, color: '#10b981' },
                          { label: 'Submission Deadline', value: hackathonData.submissionDeadline, color: '#f59e0b' },
                          { label: 'Hackathon End', value: hackathonData.endDate, color: '#8b5cf6' },
                        ].map((item) => (
                          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 6 }}>
                            <div style={{ width: 4, height: 32, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 10, color: '#94a3b8', fontFamily: '"DM Mono", monospace', letterSpacing: 0.5 }}>{item.label.toUpperCase()}</p>
                              <p style={{ fontSize: 12, fontWeight: 500, color: '#1e293b' }}>
                                {new Date(item.value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p style={{ fontSize: 9, color: '#94a3b8', fontFamily: '"DM Mono", monospace' }}>
                                {new Date(item.value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tracks & Eligibility Card */}
                    <div className="card-cc">
                      <p className="section-label">Tracks & Eligibility</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Themed Tracks */}
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: '"DM Mono", monospace', letterSpacing: 0.5 }}>THEMED TRACKS</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {hackathonData?.themedTracks && hackathonData.themedTracks.length > 0 ? (
                              hackathonData.themedTracks.map((t: string) => (
                                <span key={t} style={{ padding: '3px 8px', background: '#eef2ff', borderRadius: 4, fontSize: 10, color: '#6366f1', fontFamily: '"DM Mono", monospace' }}>
                                  {TRACK_ICONS[t] || '🎯'} {TRACK_NAMES[t] || t}
                                </span>
                              ))
                            ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>None specified</span>}
                          </div>
                        </div>
                        {/* Target Batches */}
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: '"DM Mono", monospace', letterSpacing: 0.5 }}>TARGET BATCHES</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {hackathonData?.targetBatches && hackathonData.targetBatches.length > 0 ? (
                              hackathonData.targetBatches.map((b: string) => (
                                <span key={b} style={{ padding: '3px 8px', background: '#f0fdf4', borderRadius: 4, fontSize: 10, color: '#16a34a', fontFamily: '"DM Mono", monospace' }}>{b}</span>
                              ))
                            ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>All years</span>}
                          </div>
                        </div>
                        {/* Allowed Departments */}
                        <div>
                          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: '"DM Mono", monospace', letterSpacing: 0.5 }}>DEPARTMENTS</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {hackathonData?.allowedDepartments && hackathonData.allowedDepartments.length > 0 ? (
                              hackathonData.allowedDepartments.map((d: string) => (
                                <span key={d} style={{ padding: '3px 8px', background: '#fef3c7', borderRadius: 4, fontSize: 10, color: '#92400e', fontFamily: '"DM Mono", monospace' }}>{d}</span>
                              ))
                            ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>All departments</span>}
                          </div>
                        </div>
                        {/* Eligibility Domain */}
                        {hackathonData?.eligibilityDomain && (
                          <div style={{ padding: '6px 10px', background: '#f5f3ff', borderRadius: 6, border: '1px solid #ede9fe' }}>
                            <span style={{ fontSize: 10, color: '#7c3aed', fontFamily: '"DM Mono", monospace', letterSpacing: 0.5 }}>ELIGIBILITY</span>
                            <p style={{ fontSize: 11, color: '#5b21b6', marginTop: 2 }}>{hackathonData.eligibilityDomain}</p>
                          </div>
                        )}
                        {/* Cross-Year Teams */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: hackathonData?.allowCrossYearTeams ? '#f0fdf4' : '#f8fafc', borderRadius: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: hackathonData?.allowCrossYearTeams ? '#16a34a' : '#cbd5e1' }} />
                          <span style={{ fontSize: 11, color: '#64748b' }}>Cross-year teams {hackathonData?.allowCrossYearTeams ? 'allowed' : 'not allowed'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Management */}
                    <div className="card-cc">
                      <p className="section-label">Timeline Management</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <input className="cc-input" placeholder="Event title" value={timelineForm.title} onChange={(e) => setTimelineForm((p) => ({ ...p, title: e.target.value }))} />
                        <input className="cc-input" placeholder="Type" value={timelineForm.type} onChange={(e) => setTimelineForm((p) => ({ ...p, type: e.target.value }))} />
                        <input className="cc-input" placeholder="Description" value={timelineForm.description} onChange={(e) => setTimelineForm((p) => ({ ...p, description: e.target.value }))} style={{ gridColumn: 'span 2' }} />
                        <input type="datetime-local" className="cc-input" value={timelineForm.startTime} onChange={(e) => setTimelineForm((p) => ({ ...p, startTime: e.target.value }))} />
                        <input type="datetime-local" className="cc-input" value={timelineForm.endTime} onChange={(e) => setTimelineForm((p) => ({ ...p, endTime: e.target.value }))} />
                      </div>
                      <button className="cc-btn cc-btn-primary" onClick={saveTimelineEvent} style={{ marginBottom: 12 }}>
                        {timelineForm.id ? '↑ UPDATE EVENT' : '+ ADD EVENT'}
                      </button>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                        {timelineEvents.length === 0 ? (
                          <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 11, textAlign: 'center', padding: 12 }}>NO EVENTS</p>
                        ) : timelineEvents.slice(0, 5).map((ev) => (
                          <div key={ev.id} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: '#1e293b' }}>{ev.title}</p>
                              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8' }}>{new Date(ev.startTime).toLocaleDateString()}</p>
                            </div>
                            <button className="cc-btn cc-btn-ghost" style={{ width: 'auto', padding: '3px 8px', fontSize: 9 }} onClick={() => setTimelineForm({ id: ev.id, title: ev.title || '', description: ev.description || '', type: ev.type || 'general', startTime: new Date(ev.startTime).toISOString().slice(0, 16), endTime: new Date(ev.endTime).toISOString().slice(0, 16) })}>
                              EDIT
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submission Requirements Card */}
                    <div className="card-cc">
                      <p className="section-label">Submission Requirements</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hackathonData?.submissionRequirements && hackathonData.submissionRequirements.length > 0 ? (
                          hackathonData.submissionRequirements.map((req: string) => (
                            <div key={req} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f0fdf4', borderRadius: 6 }}>
                              <span style={{ color: '#16a34a', fontSize: 12 }}>✓</span>
                              <span style={{ fontSize: 11, color: '#166534' }}>{SUBMISSION_LABELS[req] || req}</span>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>No requirements specified</p>
                        )}
                      </div>
                    </div>

                    {/* Judging Rubric Card */}
                    <div className="card-cc">
                      <p className="section-label">Judging Rubric</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hackathonData?.rubricItems && hackathonData.rubricItems.length > 0 ? (
                          <>
                            {hackathonData.rubricItems.slice(0, 5).map((item: any, idx: number) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f8fafc', borderRadius: 6 }}>
                                <span style={{ fontSize: 11, color: '#475569' }}>{item.name}</span>
                                <span style={{ fontSize: 11, fontFamily: '"DM Mono", monospace', color: '#6366f1', fontWeight: 600 }}>{item.weight}%</span>
                              </div>
                            ))}
                            <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', paddingTop: 4 }}>
                              {hackathonData.rubricItems.length} criteria total
                            </div>
                          </>
                        ) : (
                          <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>No rubric defined</p>
                        )}
                      </div>
                    </div>

                    {/* Sponsors Card */}
                    <div className="card-cc">
                      <p className="section-label">Sponsors ({hackathonData?.sponsorDetails?.length || 0})</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hackathonData?.sponsorDetails && hackathonData.sponsorDetails.length > 0 ? (
                          hackathonData.sponsorDetails.map((s: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              {s.logoUrl && <img src={s.logoUrl} alt={s.name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }} />}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</p>
                                {s.tier && <span style={{ fontSize: 9, color: '#6366f1', fontFamily: '"DM Mono", monospace' }}>{s.tier}</span>}
                              </div>
                              {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: '#6366f1', textDecoration: 'none' }}>↗</a>}
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>No sponsors added</p>
                        )}
                      </div>
                    </div>

                    {/* External Judges from Form */}
                    <div className="card-cc">
                      <p className="section-label">External Judges ({hackathonData?.judgeDetails?.length || 0})</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hackathonData?.judgeDetails && hackathonData.judgeDetails.length > 0 ? (
                          hackathonData.judgeDetails.map((j: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: 11, fontWeight: 600 }}>
                                {j.name?.charAt(0) || '?'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{j.name}</p>
                                <p style={{ fontSize: 9, color: '#94a3b8', fontFamily: '"DM Mono", monospace' }}>{j.email}{j.company ? ` · ${j.company}` : ''}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>No external judges added</p>
                        )}
                      </div>
                    </div>

                    {/* Internal Mentors from Form */}
                    <div className="card-cc">
                      <p className="section-label">Internal Mentors ({hackathonData?.internalMentors?.length || 0})</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hackathonData?.internalMentors && hackathonData.internalMentors.length > 0 ? (
                          hackathonData.internalMentors.map((m: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: 11, fontWeight: 600 }}>
                                {m.name?.charAt(0) || '?'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{m.name}</p>
                                <p style={{ fontSize: 9, color: '#94a3b8', fontFamily: '"DM Mono", monospace' }}>
                                  {m.department}{m.expertise ? ` · ${m.expertise}` : ''}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: 11, color: '#94a3b8', padding: '8px 0' }}>No internal mentors assigned</p>
                        )}
                      </div>
                    </div>

                    {/* Meals & Perks Card */}
                    <div className="card-cc">
                      <p className="section-label">Meals & Perks</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          {[
                            { label: 'Breakfast', provided: hackathonData?.breakfastProvided, icon: '🌅' },
                            { label: 'Lunch', provided: hackathonData?.lunchProvided, icon: '☀️' },
                            { label: 'Dinner', provided: hackathonData?.dinnerProvided, icon: '🌙' },
                            { label: 'Swag', provided: hackathonData?.swagProvided, icon: '👕' },
                          ].map((meal) => (
                            <div key={meal.label} style={{
                              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                              background: meal.provided ? '#f0fdf4' : '#f8fafc',
                              borderRadius: 6, border: `1px solid ${meal.provided ? '#bbf7d0' : '#e2e8f0'}`,
                            }}>
                              <span style={{ fontSize: 14 }}>{meal.icon}</span>
                              <span style={{ fontSize: 11, color: meal.provided ? '#166534' : '#94a3b8' }}>{meal.label}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 10, color: meal.provided ? '#16a34a' : '#cbd5e1' }}>
                                {meal.provided ? '✓' : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                        {hackathonData?.mealSchedule && hackathonData.mealSchedule.length > 0 && (
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                            <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: '"DM Mono", monospace', letterSpacing: 0.5 }}>MEAL SCHEDULE ({hackathonData.mealSchedule.length} slots)</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                              {hackathonData.mealSchedule.slice(0, 4).map((meal: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#f8fafc', borderRadius: 4 }}>
                                  <span style={{ fontSize: 10, color: '#475569' }}>{meal.name}</span>
                                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: '"DM Mono", monospace' }}>Day {meal.day}</span>
                                </div>
                              ))}
                              {hackathonData.mealSchedule.length > 4 && (
                                <span style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>+{hackathonData.mealSchedule.length - 4} more</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zone C: Personnel */}
                <div>
                  <div className="cc-zone-header">
                    <div className="cc-zone-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>👥</div>
                    <div>
                      <h3 className="cc-zone-title">Personnel</h3>
                      <p className="cc-zone-desc">Manage mentors, judges, and staff</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {/* Staff Stats */}
                    <div className="card-cc">
                      <p className="section-label">Staff Overview</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ padding: '14px 16px', background: '#eef2ff', borderRadius: 10, border: '1.5px solid #c7d2fe', textAlign: 'center' }}>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#6366f1', letterSpacing: 1, marginBottom: 4 }}>JUDGES</p>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 28, fontWeight: 500, color: '#4f46e5' }}>{staff.judges.length}</p>
                        </div>
                        <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: 10, border: '1.5px solid #bbf7d0', textAlign: 'center' }}>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#16a34a', letterSpacing: 1, marginBottom: 4 }}>MENTORS</p>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 28, fontWeight: 500, color: '#15803d' }}>{staff.mentors.length}</p>
                        </div>
                      </div>
                    </div>

                    {/* Quick Add Staff */}
                    <div className="card-cc">
                      <p className="section-label">Invite Staff</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <input className="cc-input" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="Email address" />
                        <select className="cc-select" value={staffType} onChange={(e) => setStaffType(e.target.value as any)}>
                          <option value="JUDGE">Judge</option>
                          <option value="MENTOR">Mentor</option>
                        </select>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <button className="cc-btn cc-btn-secondary" onClick={addStaff} disabled={staffLoading}>+ ADD</button>
                          <button className="cc-btn cc-btn-primary" onClick={sendStaffInvite} disabled={staffLoading}>
                            ✉ INVITE
                          </button>
                        </div>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                          Invite sends credentials via email
                        </p>
                      </div>
                    </div>

                    {/* Judges List */}
                    <div className="card-cc">
                      <p className="section-label">Judges ({staff.judges.length})</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                        {staff.judges.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 10, textAlign: 'center', padding: 16 }}>NO JUDGES</p>
                        ) : staff.judges.map((judge) => (
                          <div key={judge.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: 11 }}>
                              {judge.name?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{judge.name}</p>
                              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{judge.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mentors List */}
                    <div className="card-cc">
                      <p className="section-label">Mentors ({staff.mentors.length})</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                        {staff.mentors.length === 0 ? (
                          <p style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 10, textAlign: 'center', padding: 16 }}>NO MENTORS</p>
                        ) : staff.mentors.map((mentor) => (
                          <div key={mentor.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: 11 }}>
                              {mentor.name?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentor.name}</p>
                              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mentor.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button className="cc-btn cc-btn-secondary" onClick={autoAssignMentors} disabled={staffLoading} style={{ marginTop: 10 }}>
                        ⇄ AUTO-ASSIGN MENTORS
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── MONITOR TAB ── */}
            {activeTab === 'monitor' && (() => {
              const now = Date.now();
              const deadlines = hackathonData ? [
                { label: 'Registration Closes', date: new Date(hackathonData.registrationDeadline), color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                { label: 'Submission Deadline', date: new Date(hackathonData.submissionDeadline), color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                { label: 'Hackathon Ends', date: new Date(hackathonData.endDate), color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
              ] : [];
              const formatCountdown = (date: Date) => {
                const diff = date.getTime() - now;
                if (diff <= 0) return { text: 'PASSED', urgent: false, done: true };
                const d = Math.floor(diff / 86400000);
                const h = Math.floor((diff % 86400000) / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                if (d > 0) return { text: `${d}d ${h}h`, urgent: d <= 1, done: false };
                if (h > 0) return { text: `${h}h ${m}m`, urgent: true, done: false };
                return { text: `${m}m`, urgent: true, done: false };
              };

              const totalTeams = stats?.totalTeams ?? 0;
              const submittedCount = stats?.submittedCount ?? 0;
              const submissionRate = totalTeams > 0 ? Math.round((submittedCount / totalTeams) * 100) : 0;
              const healthyCount = stats?.healthyCount ?? 0;
              const healthRate = submittedCount > 0 ? Math.round((healthyCount / submittedCount) * 100) : 0;
              const openTickets = stats?.openTickets ?? 0;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Row 1: Deadline Countdowns */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {deadlines.map((dl) => {
                      const cd = formatCountdown(dl.date);
                      return (
                        <div key={dl.label} className="card-cc" style={{ borderColor: cd.done ? '#f1f5f9' : cd.urgent ? dl.border : '#f1f5f9' }}>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: 1.5, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 10 }}>{dl.label}</p>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 24, fontWeight: 500, color: cd.done ? '#cbd5e1' : dl.color, lineHeight: 1 }}>
                            {cd.text}
                          </p>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', marginTop: 6 }}>
                            {dl.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {dl.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {cd.urgent && !cd.done && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '2px 8px', background: dl.bg, border: `1px solid ${dl.border}`, borderRadius: 10, fontFamily: '"DM Mono", monospace', fontSize: 9, color: dl.color }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: dl.color }} />
                              SOON
                            </span>
                          )}
                          {cd.done && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '2px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8' }}>
                              PASSED
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 2: Participation Health */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {/* Submission Progress */}
                    <div className="card-cc">
                      <p className="section-label">Submission Progress</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#475569' }}>Teams submitted</span>
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 500, color: '#6366f1' }}>{submittedCount} / {totalTeams}</span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${submissionRate}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                          </div>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{submissionRate}% SUBMISSION RATE</p>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#475569' }}>Healthy submissions</span>
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 13, fontWeight: 500, color: '#10b981' }}>{healthyCount} / {submittedCount}</span>
                          </div>
                          <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${healthRate}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                          </div>
                          <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', marginTop: 4 }}>{healthRate}% PASS HEALTH CHECK</p>
                        </div>
                        {openTickets > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 8 }}>
                            <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#b91c1c' }}>Open support tickets</span>
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 16, fontWeight: 500, color: '#ef4444' }}>{openTickets}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Team Distribution */}
                    <div className="card-cc">
                      <p className="section-label">Team Size Distribution</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Object.entries(stats?.teamDistribution || {}).length === 0 ? (
                          <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 11, textAlign: 'center', padding: 16 }}>NO TEAMS YET</p>
                        ) : Object.entries(stats?.teamDistribution || {}).map(([size, count]) => (
                          <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 52, fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>SIZE {size}</span>
                            <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${(Number(count) / maxDistribution) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4, transition: 'width 0.8s ease' }} />
                            </div>
                            <span style={{ width: 24, fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6366f1', textAlign: 'right', fontWeight: 500 }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skill Heatmap */}
                    <div className="card-cc">
                      <p className="section-label">Skill Heatmap</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {(stats?.skillHeatmap || []).length === 0 ? (
                          <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 11, textAlign: 'center', padding: 16, gridColumn: 'span 2' }}>NO DATA YET</p>
                        ) : (stats?.skillHeatmap || []).map((s) => {
                          const intensity = s.count / maxSkill;
                          return (
                            <div key={s.skill} style={{
                              padding: '8px 10px', borderRadius: 8,
                              background: `rgba(99,102,241,${0.04 + intensity * 0.12})`,
                              border: `1.5px solid rgba(99,102,241,${0.08 + intensity * 0.18})`,
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, color: '#475569' }}>{s.skill}</span>
                              <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6366f1', fontWeight: 500 }}>{s.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Submissions Table */}
                  <div className="card-cc">
                    <p className="section-label">Submissions</p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {['Team', 'Members', 'Status', 'GitHub', 'Live URL', 'Health', 'Submitted'].map((h) => (
                              <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontFamily: '"DM Mono", monospace', fontSize: 9, letterSpacing: 1.5, color: '#94a3b8', borderBottom: '1.5px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 11 }}>NO SUBMISSIONS YET</td></tr>
                          ) : submissions.map((s) => {
                            const health = s.isHealthy
                              ? { label: 'HEALTHY', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
                              : s.healthCheckAt
                                ? { label: 'BROKEN', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
                                : { label: 'CHECKING', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
                            return (
                              <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                <td style={{ padding: '11px 14px', fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#1e293b', fontWeight: 600 }}>{s.team?.name}</td>
                                <td style={{ padding: '11px 14px', fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6366f1' }}>{s.team?.members?.length ?? '—'}</td>
                                <td style={{ padding: '11px 14px' }}>
                                  <span className="status-pill" style={{ background: '#eff6ff', color: '#3b82f6', border: '1.5px solid #bfdbfe' }}>
                                    <span className="status-dot" style={{ background: '#3b82f6' }} />{s.status}
                                  </span>
                                </td>
                                <td style={{ padding: '11px 14px' }}>
                                  {s.githubUrl ? <a href={s.githubUrl} target="_blank" style={{ color: '#6366f1', fontFamily: '"DM Mono", monospace', fontSize: 10, textDecoration: 'none', fontWeight: 500 }}>→ REPO</a> : <span style={{ color: '#e2e8f0' }}>—</span>}
                                </td>
                                <td style={{ padding: '11px 14px' }}>
                                  {s.liveUrl ? <a href={s.liveUrl} target="_blank" style={{ color: '#0ea5e9', fontFamily: '"DM Mono", monospace', fontSize: 10, textDecoration: 'none', fontWeight: 500 }}>→ LIVE</a> : <span style={{ color: '#e2e8f0' }}>—</span>}
                                </td>
                                <td style={{ padding: '11px 14px' }}>
                                  <span className="status-pill" style={{ background: health.bg, color: health.color, border: `1.5px solid ${health.border}` }}>
                                    <span className="status-dot" style={{ background: health.color }} />{health.label}
                                  </span>
                                </td>
                                <td style={{ padding: '11px 14px', fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                  {s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Row 4: Teams */}
                  <div className="card-cc">
                    <p className="section-label">Team Roster</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                      {teams.length === 0 ? (
                        <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 11, textAlign: 'center', padding: 16, gridColumn: '1 / -1' }}>NO TEAMS YET</p>
                      ) : teams.map((t) => {
                        const hasSubmission = submissions.some((s: any) => s.team?.id === t.id);
                        return (
                          <div key={t.id} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 9, border: `1.5px solid ${hasSubmission ? '#bbf7d0' : '#f1f5f9'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {hasSubmission && <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 8, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: 8 }}>SUBMITTED</span>}
                                <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#6366f1', background: '#eef2ff', padding: '2px 8px', borderRadius: 10 }}>{t.members?.length || 0}</span>
                              </div>
                            </div>
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, color: '#94a3b8' }}>
                              {t.members?.map((m: any) => m.user.name).join(', ') || 'No members'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* ── COMMS TAB ── */}
            {activeTab === 'comms' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                <div className="card-cc">
                  <p className="section-label">Publish Announcement</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input className="cc-input" type="text" placeholder="Announcement title" value={newAnnouncement.title} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} />
                    <textarea className="cc-input" placeholder="Write your message..." value={newAnnouncement.content} onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                      <select className="cc-select" value={announcementChannel} onChange={(e) => setAnnouncementChannel(e.target.value)}>
                        <option value="website">Website only</option>
                        <option value="discord">Discord only</option>
                        <option value="both">Both channels</option>
                      </select>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                        <div
                          className="toggle-track"
                          style={{ background: newAnnouncement.isUrgent ? '#ef4444' : '#e2e8f0' }}
                          onClick={() => setNewAnnouncement({ ...newAnnouncement, isUrgent: !newAnnouncement.isUrgent })}
                        >
                          <div className="toggle-thumb" style={{ transform: newAnnouncement.isUrgent ? 'translateX(16px)' : 'none' }} />
                        </div>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: newAnnouncement.isUrgent ? '#ef4444' : '#94a3b8' }}>URGENT</span>
                      </label>
                    </div>
                    <button className="cc-btn cc-btn-primary" onClick={handlePublishAnnouncement} disabled={isPublishing}>
                      {isPublishing ? '● PUBLISHING...' : '▶ PUBLISH'}
                    </button>
                  </div>
                </div>

                <div className="card-cc">
                  <p className="section-label">Recent Announcements</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
                    {announcements.length === 0 ? (
                      <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 11, textAlign: 'center', padding: 24 }}>NO ANNOUNCEMENTS</p>
                    ) : announcements.map((a) => (
                      <div key={a.id} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: `1.5px solid ${a.isUrgent ? '#fecaca' : '#f1f5f9'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{a.title}</span>
                          {a.isUrgent && (
                            <span className="status-pill" style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', flexShrink: 0 }}>
                              <span className="status-dot" style={{ background: '#ef4444' }} />URGENT
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#64748b', lineHeight: 1.55, marginBottom: 8 }}>{a.content}</p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#cbd5e1', letterSpacing: 0.5 }}>
                          {a.author.name} · {new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── CONTROLS TAB ── */}
            {activeTab === 'controls' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>

                {/* Hackathon Status */}
                <div className="card-cc">
                  <p className="section-label">Hackathon Status</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <select className="cc-select" value={statusControl} onChange={(e) => setStatusControl(e.target.value)}>
                      {['draft', 'published', 'ongoing', 'judging', 'ended'].map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="cc-input" type="number" value={maxTeams} onChange={(e) => setMaxTeams(parseInt(e.target.value || '0', 10))} placeholder="Max teams" />
                      <span style={{ color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap', fontFamily: '"DM Mono", monospace' }}>MAX</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button className="cc-btn cc-btn-secondary" onClick={saveHackathonControls} disabled={isSavingControls}>
                        {isSavingControls ? 'SAVING...' : 'SAVE CHANGES'}
                      </button>
                      <button className="cc-btn cc-btn-primary" onClick={publishHackathon} disabled={isPublishingHackathon}>
                        {isPublishingHackathon ? 'PUBLISHING...' : 'PUBLISH'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Staff */}
                <div className="card-cc">
                  <p className="section-label">Staff Management</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', gap: 8, padding: '12px 14px', background: '#f8fafc', borderRadius: 9, border: '1.5px solid #f1f5f9' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#6366f1', letterSpacing: 1 }}>JUDGES</p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 500, color: '#1e293b' }}>{staff.judges.length}</p>
                      </div>
                      <div style={{ width: 1, background: '#e2e8f0' }} />
                      <div style={{ flex: 1, paddingLeft: 12 }}>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#8b5cf6', letterSpacing: 1 }}>MENTORS</p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 22, fontWeight: 500, color: '#1e293b' }}>{staff.mentors.length}</p>
                      </div>
                    </div>
                    <input className="cc-input" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} placeholder="Staff email address" />
                    <select className="cc-select" value={staffType} onChange={(e) => setStaffType(e.target.value as any)}>
                      <option value="JUDGE">Judge</option>
                      <option value="MENTOR">Mentor</option>
                    </select>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button className="cc-btn cc-btn-secondary" onClick={addStaff} disabled={staffLoading}>+ ADD STAFF</button>
                      <button className="cc-btn cc-btn-primary" onClick={sendStaffInvite} disabled={staffLoading}>✉ SEND INVITE</button>
                    </div>
                    <button className="cc-btn cc-btn-secondary" onClick={autoAssignMentors} disabled={staffLoading}>⇄ AUTO-ASSIGN MENTORS</button>
                  </div>
                </div>

                <div className="card-cc">
                  <p className="section-label">Mentors & Judges</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 9, border: '1.5px solid #f1f5f9' }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#6366f1', letterSpacing: 1, marginBottom: 6 }}>JUDGES</p>
                      {staff.judges.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 10 }}>NO JUDGES</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                          {staff.judges.map((judge) => (
                            <div key={judge.id} style={{ padding: '6px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{judge.name}</p>
                              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94a3b8' }}>{judge.email}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 9, border: '1.5px solid #f1f5f9' }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#8b5cf6', letterSpacing: 1, marginBottom: 6 }}>MENTORS</p>
                      {staff.mentors.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 10 }}>NO MENTORS</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                          {staff.mentors.map((mentor) => (
                            <div key={mentor.id} style={{ padding: '6px 8px', borderRadius: 6, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                              <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{mentor.name}</p>
                              <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94a3b8' }}>{mentor.email}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Judging */}
                <div className="card-cc">
                  <p className="section-label">Judging Control</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: judgingControl.judgingOpen ? '#f0fdf4' : '#f8fafc', borderRadius: 9, border: `1.5px solid ${judgingControl.judgingOpen ? '#bbf7d0' : '#f1f5f9'}` }}>
                      <div>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#64748b' }}>Judging Round</p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: judgingControl.judgingOpen ? '#16a34a' : '#94a3b8', marginTop: 2 }}>{judgingControl.judgingOpen ? 'OPEN' : 'CLOSED'}</p>
                      </div>
                      <div className="toggle-track" style={{ background: judgingControl.judgingOpen ? '#10b981' : '#e2e8f0' }} onClick={() => updateJudgingControl({ judgingOpen: !judgingControl.judgingOpen })}>
                        <div className="toggle-thumb" style={{ transform: judgingControl.judgingOpen ? 'translateX(16px)' : 'none' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: judgingControl.blindMode ? '#f5f3ff' : '#f8fafc', borderRadius: 9, border: `1.5px solid ${judgingControl.blindMode ? '#ddd6fe' : '#f1f5f9'}` }}>
                      <div>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#64748b' }}>Blind Mode</p>
                        <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: judgingControl.blindMode ? '#7c3aed' : '#94a3b8', marginTop: 2 }}>{judgingControl.blindMode ? 'ENABLED' : 'DISABLED'}</p>
                      </div>
                      <div className="toggle-track" style={{ background: judgingControl.blindMode ? '#8b5cf6' : '#e2e8f0' }} onClick={() => updateJudgingControl({ blindMode: !judgingControl.blindMode })}>
                        <div className="toggle-thumb" style={{ transform: judgingControl.blindMode ? 'translateX(16px)' : 'none' }} />
                      </div>
                    </div>
                    <button className="cc-btn cc-btn-secondary" onClick={createRubric}>CREATE DEFAULT RUBRIC</button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card-cc">
                  <p className="section-label">Quick Actions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button className="cc-btn cc-btn-danger" onClick={() => runQuickAction('LOCK_SUBMISSIONS')}>⊘ LOCK SUBMISSIONS</button>
                    <button className="cc-btn cc-btn-secondary" onClick={() => runQuickAction('OPEN_JUDGING')}>◎ OPEN JUDGING</button>
                    <div style={{ borderTop: '1.5px solid #f1f5f9', paddingTop: 10 }}>
                      <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 9, color: '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>EXTEND DEADLINE TO</p>
                      <input type="datetime-local" className="cc-input" value={extendDeadline} onChange={(e) => setExtendDeadline(e.target.value)} style={{ marginBottom: 8 }} />
                      <button className="cc-btn cc-btn-secondary" onClick={() => runQuickAction('EXTEND_DEADLINE')}>↗ EXTEND DEADLINE</button>
                    </div>
                  </div>
                </div>

                {/* Score Summary */}
                <div className="card-cc">
                  <p className="section-label">Score Summary</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Average Score',     value: stats?.averageScore?.toFixed(1) ?? '—', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
                      { label: 'Total Scores',       value: stats?.totalScores ?? '—',              color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                      { label: 'Total Attendances',  value: stats?.totalAttendances ?? '—',         color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: item.bg, borderRadius: 9, border: `1.5px solid ${item.border}` }}>
                        <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, color: '#64748b' }}>{item.label}</span>
                        <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 18, fontWeight: 500, color: item.color }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ── CERTIFICATES TAB ── */}
            {activeTab === 'certificates' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                <div className="card-cc">
                  <p className="section-label">Certificate Generator</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input className="cc-input" value={certificateUserId} onChange={(e) => setCertificateUserId(e.target.value)} placeholder="User ID" />
                    <select className="cc-select" value={certificateType} onChange={(e) => setCertificateType(e.target.value)}>
                      <option value="PARTICIPANT">Participant</option>
                      <option value="WINNER">Winner</option>
                      <option value="RUNNER_UP">Runner Up</option>
                      <option value="BEST_PROJECT">Best Project</option>
                    </select>
                    <button className="cc-btn cc-btn-secondary" onClick={generateCertificate}>✦ GENERATE CERTIFICATE</button>
                    <button className="cc-btn cc-btn-primary" onClick={autoGenerateCertificates} disabled={autoCertLoading}>
                      {autoCertLoading ? 'GENERATING...' : 'AUTO-GENERATE ALL'}
                    </button>
                  </div>
                </div>

                <div className="card-cc">
                  <p className="section-label">Certificates</p>
                  {certificatesLoading ? (
                    <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 10 }}>LOADING...</p>
                  ) : certificates.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 10 }}>NO CERTIFICATES YET</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                      {certificates.map((cert: any) => (
                        <div key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', gap: 10 }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cert.user?.name || 'User'}</p>
                            <p style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#94a3b8' }}>{cert.type}</p>
                          </div>
                          {cert.certificateUrl ? (
                            <a
                              href={cert.certificateUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#6366f1', textDecoration: 'none' }}
                            >
                              VIEW
                            </a>
                          ) : (
                            <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 10, color: '#cbd5e1' }}>PENDING</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card-cc">
                  <p className="section-label">Rankings</p>
                  {rankingsLoading ? (
                    <p style={{ color: '#cbd5e1', fontFamily: '"DM Mono", monospace', fontSize: 10 }}>LOADING...</p>
                  ) : rankings.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontFamily: '"DM Mono", monospace', fontSize: 10 }}>NO SCORES YET</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                      {rankings.map((entry: any) => (
                        <div key={entry.teamId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>#{entry.rank} {entry.teamName}</span>
                          <span style={{ fontFamily: '"DM Mono", monospace', fontSize: 11, color: '#6366f1' }}>{entry.totalScore}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Hackathon Modal */}
      {showEditModal && hackathonData && (
        <EditHackathonModal
          hackathon={hackathonData}
          onClose={() => setShowEditModal(false)}
          onSave={(updated) => {
            setHackathonData(prev => prev ? { ...prev, ...updated } : null);
            showFeedback('Hackathon details updated');
          }}
        />
      )}
    </>
  );
}