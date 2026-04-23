'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Trash2, Users, Shuffle } from 'lucide-react';

interface StaffMember { id: string; name: string; email: string; role: string }
interface Props { hackathonId: string }

export default function StaffManagement({ hackathonId }: Props) {
  const [judges, setJudges] = useState<StaffMember[]>([]);
  const [mentors, setMentors] = useState<StaffMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'JUDGE' | 'MENTOR'>('JUDGE');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'JUDGE' | 'MENTOR'>('JUDGE');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadStaff = async () => {
    const res = await fetch(`/api/hackathons/${hackathonId}/staff`);
    const data = await res.json();
    setJudges(data.data?.judges || []);
    setMentors(data.data?.mentors || []);
  };

  useEffect(() => { if (hackathonId) loadStaff(); }, [hackathonId]);

  const showFeedback = (msg: string, ok: boolean) => { setFeedback(msg); setTimeout(() => setFeedback(''), 3000); };

  async function addStaff() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: role }),
      });
      const data = await res.json();
      if (res.ok) { setJudges(data.data.judges || []); setMentors(data.data.mentors || []); setEmail(''); showFeedback(`${role.toLowerCase()} added`, true); }
      else showFeedback(data.error || 'Failed', false);
    } catch { showFeedback('Network error', false); }
    setLoading(false);
  }

  async function removeStaff(memberId: string) {
    const res = await fetch(`/api/hackathons/${hackathonId}/staff?staffId=${memberId}`, { method: 'DELETE' });
    if (res.ok) loadStaff();
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff/invite`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) { setInviteEmail(''); showFeedback('Invite sent', true); }
      else { const d = await res.json(); showFeedback(d.error || 'Failed', false); }
    } catch { showFeedback('Network error', false); }
    setLoading(false);
  }

  async function autoAssign() {
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/staff/auto-assign`, { method: 'POST' });
      const data = await res.json();
      showFeedback(res.ok ? data.message || 'Done' : data.error || 'Failed', res.ok);
    } catch { showFeedback('Failed', false); }
    setLoading(false);
  }

  const StaffList = ({ list, type }: { list: StaffMember[]; type: string }) => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="org-label">{type} ({list.length})</p>
      </div>
      {list.length === 0 ? (
        <p className="org-text" style={{ padding: '0.75rem 0' }}>No {type.toLowerCase()} assigned.</p>
      ) : list.map((s) => (
        <div key={s.id} className="org-row">
          <div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>{s.email}</span>
          </div>
          <button className="org-btn-danger" onClick={() => removeStaff(s.id)} style={{ padding: '0.3rem 0.5rem' }}>
            <Trash2 style={{ width: 12, height: 12 }} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {feedback && <div className={`org-feedback ${feedback.includes('added') || feedback.includes('sent') || feedback.includes('Done') ? 'org-feedback-success' : 'org-feedback-error'}`}>{feedback}</div>}

      {/* Add */}
      <div className="org-section">
        <p className="org-label" style={{ marginBottom: '0.6rem' }}>Add Staff</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="org-input" placeholder="user@email.com" value={email} onChange={(e) => setEmail(e.target.value)} style={{ flex: 1 }} />
          <select className="org-select" value={role} onChange={(e) => setRole(e.target.value as any)} style={{ width: 120 }}>
            <option value="JUDGE">Judge</option>
            <option value="MENTOR">Mentor</option>
          </select>
          <button className="org-btn-primary" onClick={addStaff} disabled={loading || !email.trim()}><Plus style={{ width: 14, height: 14 }} />Add</button>
        </div>
      </div>

      {/* Invite */}
      <div className="org-section">
        <p className="org-label" style={{ marginBottom: '0.6rem' }}>Invite by Email</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="org-input" placeholder="invite@email.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} style={{ flex: 1 }} />
          <select className="org-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} style={{ width: 120 }}>
            <option value="JUDGE">Judge</option>
            <option value="MENTOR">Mentor</option>
          </select>
          <button className="org-btn-secondary" onClick={sendInvite} disabled={loading || !inviteEmail.trim()}><Mail style={{ width: 14, height: 14 }} />Invite</button>
        </div>
      </div>

      {/* Auto-assign */}
      <button className="org-btn-secondary" onClick={autoAssign} disabled={loading} style={{ alignSelf: 'flex-start' }}>
        <Shuffle style={{ width: 14, height: 14 }} />Auto-Assign Mentors
      </button>

      {/* Lists */}
      <StaffList list={judges} type="Judges" />
      <StaffList list={mentors} type="Mentors" />
    </div>
  );
}
