'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, FileText, File, Video, Image as ImageIcon } from 'lucide-react';

interface SubmissionFile {
  url: string;
  publicId: string;
}

interface Submission {
  id: string; 
  githubUrl: string | null; 
  liveUrl: string | null; 
  status: string;
  isHealthy: boolean | null; 
  healthCheckAt: string | null; 
  submittedAt: string | null;
  description: string | null; 
  technologies: string[];
  files?: Record<string, SubmissionFile>;
  team: { 
    id: string; 
    name: string; 
    members: Array<{ user: { name: string; email: string } }> 
  };
}

interface SubmissionRequirement {
  type: string;
  label: string;
}

interface Props { 
  hackathonId: string;
  submissionRequirements?: string[];
}

// Map of requirement types to labels
const REQUIREMENT_CONFIG: Record<string, SubmissionRequirement> = {
  github: { type: 'github', label: 'GitHub Repository' },
  demo: { type: 'demo', label: 'Live Demo' },
  video: { type: 'video', label: 'Video Demo' },
  presentation: { type: 'presentation', label: 'Presentation' },
  document: { type: 'document', label: 'Documentation' },
  image: { type: 'image', label: 'Screenshots' },
  readme: { type: 'readme', label: 'README' },
  'demo-video': { type: 'demo-video', label: 'Demo Video' },
};

export default function SubmissionMonitoring({ hackathonId, submissionRequirements = [] }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending'>('all');

  useEffect(() => {
    if (!hackathonId) return;
    (async () => {
      try {
        const res = await fetch(`/api/hackathons/${hackathonId}/submissions`);
        setSubmissions((await res.json()).data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [hackathonId]);

  const filtered = submissions.filter((s) => {
    if (filter === 'submitted') return s.submittedAt;
    if (filter === 'pending') return !s.submittedAt;
    return true;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'demo-video':
        return <Video size={12} />;
      case 'image':
        return <ImageIcon size={12} />;
      default:
        return <File size={12} />;
    }
  };

  const getSubmissionStatus = (sub: Submission, requirements: string[]) => {
    const statuses: Array<{ type: string; label: string; submitted: boolean; url?: string }> = [];
    
    // Check URL-based submissions
    if (requirements.includes('github')) {
      statuses.push({
        type: 'github',
        label: 'GitHub',
        submitted: !!sub.githubUrl,
        url: sub.githubUrl || undefined,
      });
    }
    
    if (requirements.includes('demo')) {
      statuses.push({
        type: 'demo',
        label: 'Live Demo',
        submitted: !!sub.liveUrl,
        url: sub.liveUrl || undefined,
      });
    }

    // Check file-based submissions
    const fileTypes = ['video', 'presentation', 'document', 'image', 'readme', 'demo-video'];
    fileTypes.forEach(type => {
      if (requirements.includes(type)) {
        const file = sub.files?.[type];
        statuses.push({
          type,
          label: REQUIREMENT_CONFIG[type]?.label || type,
          submitted: !!file?.url,
          url: file?.url,
        });
      }
    });

    return statuses;
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><RefreshCw style={{ width: 24, height: 24, color: 'var(--text-muted)', animation: 'auth-spin 0.8s linear infinite' }} /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {(['all', 'submitted', 'pending'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'org-btn-primary' : 'org-btn-secondary'} style={{ textTransform: 'capitalize' }}>
            {f === 'pending' ? 'Not Submitted' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="org-empty"><FileText style={{ width: 28, height: 28, margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No submissions found</p></div>
      ) : filtered.map((sub) => {
        const memberNames = sub.team.members?.map((m) => m.user?.name).filter(Boolean).join(', ') || 'No members';
        const submissionStatuses = getSubmissionStatus(sub, submissionRequirements);
        
        return (
          <div key={sub.id} className="org-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{sub.team.name}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{memberNames}</p>
              </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`org-badge ${sub.submittedAt ? 'org-badge-success' : 'org-badge-warning'}`}>
                {sub.submittedAt ? 'Submitted' : 'Not Submitted'}
              </span>
            </div>
            </div>
            
            {sub.description && (
              <p className="org-text" style={{ marginBottom: '0.5rem' }}>{sub.description}</p>
            )}
            
            {sub.technologies?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
                {sub.technologies.map((t) => <span key={t} className="org-badge org-badge-info">{t}</span>)}
              </div>
            )}

            {/* Submission Requirements Status */}
            {submissionStatuses.length > 0 && (
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--bg-raised)', 
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '0.5rem'
              }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Submission Status
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {submissionStatuses.map((status) => (
                    <div key={status.type} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem',
                      background: status.submitted ? 'rgba(62, 207, 142, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {getFileIcon(status.type)}
                        <span style={{ fontSize: '0.78rem', color: status.submitted ? '#3ecf8e' : '#ef4444' }}>
                          {status.label}
                        </span>
                      </div>
                      {status.submitted && status.url && (
                        <a 
                          href={status.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.2rem', 
                            color: 'var(--accent)', 
                            fontSize: '0.7rem', 
                            textDecoration: 'none' 
                          }}
                        >
                          View <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {sub.githubUrl && (
                <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" 
                   style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.75rem', textDecoration: 'none' }}>
                  <ExternalLink style={{ width: 12, height: 12 }} />GitHub
                </a>
              )}
              {sub.liveUrl && (
                <a href={sub.liveUrl} target="_blank" rel="noopener noreferrer" 
                   style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.75rem', textDecoration: 'none' }}>
                  <ExternalLink style={{ width: 12, height: 12 }} />Live
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
