'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, AlertTriangle, Clock } from 'lucide-react';

interface Announcement {
  id: string; title: string; content: string; isUrgent: boolean;
  createdAt: string; author: { id: string; name: string };
}

interface Props { hackathonId: string }

export default function AnnouncementSystem({ hackathonId }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/announcements`);
        setAnnouncements((await res.json()).data || []);
      } catch { /* silent */ }
    })();
  }, [hackathonId]);

  async function handlePublish() {
    if (!title.trim() || !content.trim()) return;
    setLoading(true); setFeedback('');
    try {
      const res = await fetch(`/api/hackathons/${hackathonId}/announcements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, isUrgent }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements((prev) => [data.data, ...prev]);
        setTitle(''); setContent(''); setIsUrgent(false);
        setFeedback('Announcement published');
      } else { setFeedback(data.error || 'Failed'); }
    } catch { setFeedback('Network error'); }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Compose */}
      <div className="org-section">
        <p className="org-label" style={{ marginBottom: '0.75rem' }}>Publish Announcement</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <input className="org-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="org-input" placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} style={{ minHeight: 80, resize: 'vertical' as const }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div className={`org-toggle ${isUrgent ? 'org-toggle--active' : ''}`} onClick={() => setIsUrgent(!isUrgent)}>
                <div className="org-toggle-thumb" />
              </div>
              Mark as urgent
            </label>
            <button className="org-btn-primary" onClick={handlePublish} disabled={loading || !title.trim() || !content.trim()}>
              <Send style={{ width: 14, height: 14 }} />{loading ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {feedback && <div className={`org-feedback ${feedback.includes('published') ? 'org-feedback-success' : 'org-feedback-error'}`}>{feedback}</div>}

      {/* List */}
      <div>
        <p className="org-label" style={{ marginBottom: '0.75rem' }}>Recent ({announcements.length})</p>
        {announcements.length === 0 ? (
          <div className="org-empty"><Megaphone style={{ width: 24, height: 24, margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No announcements yet</p></div>
        ) : announcements.map((a) => (
          <div key={a.id} className="org-section" style={{ marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{a.title}</p>
                  {a.isUrgent && <span className="org-badge org-badge-danger"><AlertTriangle style={{ width: 10, height: 10, marginRight: 2 }} />URGENT</span>}
                </div>
                <p className="org-text">{a.content}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
              <Clock style={{ width: 11, height: 11, color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{a.author.name} &middot; {new Date(a.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
