'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Upload, 
  X, 
  FileText, 
  Video, 
  Presentation, 
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface SubmissionRequirement {
  type: 'github' | 'demo' | 'video' | 'presentation' | 'document' | 'image';
  label: string;
  description?: string;
  required: boolean;
  accept?: string;
}

interface Hackathon {
  id: string;
  title: string;
  status: string;
  submissionDeadline: string;
  submissionRequirements: string[];
}

interface Team {
  teamId: string;
  teamName: string;
  hackathonId: string;
}

interface FileUpload {
  id: string;
  type: string;
  file: File | null;
  url: string;
  publicId: string;
  uploading: boolean;
  progress: number;
  error: string;
}

interface Submission {
  id?: string;
  githubUrl?: string;
  liveUrl?: string;
  description?: string;
  technologies?: string[];
  pitchDeckUrl?: string;
  status?: string;
  submittedAt?: string;
  files?: Record<string, { url: string; publicId: string }>;
}

// Map of requirement types to labels and configurations
const REQUIREMENT_CONFIG: Record<string, Omit<SubmissionRequirement, 'required'>> = {
  github: {
    type: 'github',
    label: 'GitHub Repository',
    description: 'Link to your project repository',
    accept: undefined,
  },
  demo: {
    type: 'demo',
    label: 'Live Demo URL',
    description: 'Link to your deployed project',
    accept: undefined,
  },
  video: {
    type: 'video',
    label: 'Video Demo',
    description: 'Record a video demonstrating your project (max 5 minutes)',
    accept: 'video/*',
  },
  presentation: {
    type: 'presentation',
    label: 'Presentation / Pitch Deck',
    description: 'Upload your presentation slides (PDF, PPT, PPTX)',
    accept: '.pdf,.ppt,.pptx',
  },
  document: {
    type: 'document',
    label: 'Project Documentation',
    description: 'Upload project documentation (PDF, DOC, DOCX)',
    accept: '.pdf,.doc,.docx',
  },
  image: {
    type: 'image',
    label: 'Project Screenshots',
    description: 'Upload screenshots of your project (PNG, JPG)',
    accept: 'image/*',
  },
};

export default function HackathonSubmitPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const hackathonId = params.hackathonId as string;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [tech, setTech] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'healthy' | 'broken'>('idle');
  const [issues, setIssues] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    githubUrl: '',
    liveUrl: '',
    description: '',
    technologies: [] as string[],
  });

  // File uploads state
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);

  // Fetch hackathon and team data
  useEffect(() => {
    if (!hackathonId) return;
    
    (async () => {
      try {
        setIsLoading(true);
        
        // Fetch hackathon details and user's team in parallel
        const [hRes, tRes] = await Promise.all([
          fetch(`/api/hackathons/${hackathonId}`),
          fetch('/api/users/my-team'),
        ]);
        const hData = await hRes.json();
        const h = hData.data;
        
        if (!h) {
          setIsLoading(false);
          return;
        }

        setHackathon(h);
        setDeadlinePassed(new Date() > new Date(h.submissionDeadline));

        const tData = await tRes.json();
        const teams = tData.data || [];
        
        // Find team for this hackathon
        const hackathonTeam = teams.find((t: any) => t.hackathonId === hackathonId);
        
        if (hackathonTeam) {
          setTeam(hackathonTeam);
          
          // Fetch existing submission
          const sRes = await fetch(`/api/teams/${hackathonTeam.teamId}/submission`);
          const sData = await sRes.json();
          
          if (sData.data) {
            setSubmission(sData.data);
            setForm({
              githubUrl: sData.data.githubUrl || '',
              liveUrl: sData.data.liveUrl || '',
              description: sData.data.description || '',
              technologies: sData.data.technologies || [],
            });

            // Initialize file uploads from existing submission
            if (sData.data.files) {
              const existingUploads: FileUpload[] = Object.entries(sData.data.files).map(([type, file]: [string, any]) => ({
                id: `${type}-${Date.now()}`,
                type,
                file: null,
                url: file.url,
                publicId: file.publicId,
                uploading: false,
                progress: 100,
                error: '',
              }));
              setFileUploads(existingUploads);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [hackathonId]);

  // Initialize file upload slots based on submission requirements
  useEffect(() => {
    if (!hackathon?.submissionRequirements) return;

    const requirements = getRequirementsFromHackathon(hackathon.submissionRequirements);
    const fileRequirements = requirements.filter(r => 
      ['video', 'presentation', 'document', 'image'].includes(r.type)
    );

    if (fileUploads.length === 0 && fileRequirements.length > 0) {
      const initialUploads: FileUpload[] = fileRequirements.map(req => ({
        id: `${req.type}-new`,
        type: req.type,
        file: null,
        url: '',
        publicId: '',
        uploading: false,
        progress: 0,
        error: '',
      }));
      setFileUploads(initialUploads);
    }
  }, [hackathon, fileUploads.length]);

  // Convert hackathon submissionRequirements to detailed requirements
  const getRequirementsFromHackathon = (requirements: string[]): SubmissionRequirement[] => {
    return requirements.map(req => {
      const config = REQUIREMENT_CONFIG[req];
      if (config) {
        return { ...config, required: true };
      }
      return {
        type: req as any,
        label: req.charAt(0).toUpperCase() + req.slice(1),
        required: true,
      };
    });
  };

  // Handle file selection
  const handleFileSelect = async (uploadId: string, file: File) => {
    const upload = fileUploads.find(u => u.id === uploadId);
    if (!upload) return;

    // Update state to show uploading
    setFileUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, file, uploading: true, progress: 0, error: '' } : u
    ));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `hackmate/${hackathonId}/submissions`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFileUploads(prev => prev.map(u => 
          u.id === uploadId && u.uploading && u.progress < 90
            ? { ...u, progress: u.progress + 10 }
            : u
        ));
      }, 200);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await res.json();

      setFileUploads(prev => prev.map(u => 
        u.id === uploadId ? {
          ...u,
          url: data.url,
          publicId: data.publicId,
          uploading: false,
          progress: 100,
          error: '',
        } : u
      ));
    } catch (error) {
      console.error('Upload error:', error);
      setFileUploads(prev => prev.map(u => 
        u.id === uploadId ? {
          ...u,
          uploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
        } : u
      ));
    }
  };

  // Handle file removal
  const handleFileRemove = (uploadId: string) => {
    const upload = fileUploads.find(u => u.id === uploadId);
    if (upload?.publicId) {
      // Optionally delete from Cloudinary
      fetch(`/api/upload?publicId=${upload.publicId}`, { method: 'DELETE' });
    }

    setFileUploads(prev => prev.map(u => 
      u.id === uploadId ? { ...u, file: null, url: '', publicId: '', progress: 0, error: '' } : u
    ));
  };

  // Save submission
  const saveSubmission = async () => {
    if (!team) return;

    // Validation
    const errors: string[] = [];
    const requirements = getRequirementsFromHackathon(hackathon?.submissionRequirements || []);

    // Check required URL fields
    if (requirements.some(r => r.type === 'github' && r.required) && !form.githubUrl) {
      errors.push('GitHub Repository URL is required');
    }
    if (form.githubUrl && !/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(form.githubUrl)) {
      errors.push('GitHub URL must be a valid repository link');
    }
    if (requirements.some(r => r.type === 'demo' && r.required) && !form.liveUrl) {
      errors.push('Live Demo URL is required');
    }
    if (form.description && form.description.length < 20) {
      errors.push('Description needs at least 20 characters');
    }

    // Check required file uploads
    const fileRequirements = requirements.filter(r => 
      ['video', 'presentation', 'document', 'image'].includes(r.type) && r.required
    );
    for (const req of fileRequirements) {
      const upload = fileUploads.find(u => u.type === req.type);
      if (!upload?.url) {
        errors.push(`${req.label} is required`);
      }
    }

    if (errors.length > 0) {
      setIssues(errors);
      return;
    }

    setSaving(true);
    setStatus('checking');
    setIssues([]);

    try {
      // Build files object
      const files: Record<string, { url: string; publicId: string }> = {};
      fileUploads.forEach(upload => {
        if (upload.url && upload.publicId) {
          files[upload.type] = {
            url: upload.url,
            publicId: upload.publicId,
          };
        }
      });

      // Create payload
      const payload = {
        ...form,
        files,
      };

      const res = await fetch(`/api/teams/${team.teamId}/submission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmission(data.data);
        setIssues(data.issues || []);
        setStatus(data.healthStatus === 'healthy' ? 'healthy' : 'broken');
      } else {
        setIssues([data.error || 'Failed to save submission']);
        setStatus('broken');
      }
    } catch (error) {
      console.error('Save submission error:', error);
      setIssues(['Failed to save submission']);
      setStatus('broken');
    } finally {
      setSaving(false);
    }
  };

  // Get icon for requirement type
  const getRequirementIcon = (type: string) => {
    switch (type) {
      case 'github':
      case 'demo':
        return <LinkIcon size={18} />;
      case 'video':
        return <Video size={18} />;
      case 'presentation':
        return <Presentation size={18} />;
      case 'document':
        return <FileText size={18} />;
      case 'image':
        return <ImageIcon size={18} />;
      default:
        return <FileText size={18} />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}>
        <Loader2 size={28} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Hackathon not found.
      </div>
    );
  }

  if (!team) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          You need to be part of a team to submit a project.
        </p>
        <button 
          onClick={() => router.push('/participant/my-team')}
          className="org-btn-primary"
        >
          Go to My Team
        </button>
      </div>
    );
  }

  const requirements = getRequirementsFromHackathon(hackathon.submissionRequirements || []);
  const urlRequirements = requirements.filter(r => ['github', 'demo'].includes(r.type));
  const fileRequirements = requirements.filter(r => ['video', 'presentation', 'document', 'image'].includes(r.type));

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '0.68rem', 
          textTransform: 'uppercase', 
          letterSpacing: '0.15em', 
          color: 'var(--accent)', 
          marginBottom: '0.4rem' 
        }}>
          Submission
        </p>
        <h1 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '1.6rem', 
          fontWeight: 700, 
          color: 'var(--text-primary)', 
          letterSpacing: '-0.02em' 
        }}>
          {hackathon.title} - Submit Project
        </h1>
        <p style={{ 
          marginTop: '0.35rem', 
          color: 'var(--text-secondary)',
          fontSize: '0.875rem'
        }}>
          Submit your project for judging. Make sure to include all required materials.
        </p>
      </div>

      {/* Deadline Warning */}
      {deadlinePassed && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          color: '#ef4444',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <AlertCircle size={18} />
          <span>Submission deadline has passed. The form is locked.</span>
        </div>
      )}

      {/* Submission Requirements */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          marginBottom: '1rem',
        }}>
          Required Submissions
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {requirements.map(req => (
            <span key={req.type} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.75rem',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(232,164,74,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent)',
              fontSize: '0.8rem',
            }}>
              {getRequirementIcon(req.type)}
              {req.label}
              {req.required && <span style={{ color: '#ef4444', marginLeft: '0.2rem' }}>*</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Team Info */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Submitting as Team
          </p>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {team.teamName}
          </p>
        </div>
        {submission?.status && (
          <span className={`org-badge ${
            submission.status === 'SUBMITTED' ? 'org-badge-success' : 
            submission.status === 'APPROVED' ? 'org-badge-success' :
            'org-badge-muted'
          }`}>
            {submission.status}
          </span>
        )}
      </div>

      {/* URL Fields */}
      {urlRequirements.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}>
            Project Links
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {urlRequirements.map(req => (
              <div key={req.type}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem',
                  fontSize: '0.85rem', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '0.4rem' 
                }}>
                  {getRequirementIcon(req.type)}
                  {req.label}
                  {req.required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                {req.description && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    {req.description}
                  </p>
                )}
                <input
                  type="url"
                  className="org-input"
                  value={req.type === 'github' ? form.githubUrl : form.liveUrl}
                  onChange={(e) => {
                    if (req.type === 'github') {
                      setForm({ ...form, githubUrl: e.target.value });
                    } else {
                      setForm({ ...form, liveUrl: e.target.value });
                    }
                  }}
                  disabled={deadlinePassed}
                  placeholder={req.type === 'github' ? 'https://github.com/username/repository' : 'https://your-project.vercel.app'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Uploads */}
      {fileRequirements.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            marginBottom: '1rem',
          }}>
            File Uploads
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {fileRequirements.map(req => {
              const upload = fileUploads.find(u => u.type === req.type);
              return (
                <div key={req.type}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem',
                    fontSize: '0.85rem', 
                    color: 'var(--text-secondary)', 
                    marginBottom: '0.4rem' 
                  }}>
                    {getRequirementIcon(req.type)}
                    {req.label}
                    {req.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {req.description && (
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {req.description}
                    </p>
                  )}
                  
                  {/* Upload Zone */}
                  {!upload?.url && !upload?.uploading ? (
                    <div
                      style={{
                        border: '2px dashed var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: deadlinePassed ? 'not-allowed' : 'pointer',
                        opacity: deadlinePassed ? 0.5 : 1,
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        if (deadlinePassed) return;
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = req.accept || '*/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileSelect(upload?.id || `${req.type}-new`, file);
                        };
                        input.click();
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.background = 'var(--accent-dim)';
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.background = 'transparent';
                        if (deadlinePassed) return;
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileSelect(upload?.id || `${req.type}-new`, file);
                      }}
                    >
                      <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Drop file here or <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>browse</span>
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {req.accept ? `Accepted: ${req.accept}` : 'Any file type'} • Max 50MB
                      </p>
                    </div>
                  ) : upload?.uploading ? (
                    <div style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Uploading...</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                          {upload.progress}%
                        </span>
                      </div>
                      <div style={{
                        height: '4px',
                        background: 'var(--border-default)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${upload.progress}%`,
                          height: '100%',
                          background: 'var(--accent)',
                          transition: 'width 0.2s',
                        }} />
                      </div>
                    </div>
                  ) : upload?.url ? (
                    <div style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      background: 'var(--bg-raised)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {getRequirementIcon(req.type)}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <p style={{ 
                            fontSize: '0.85rem', 
                            color: 'var(--text-primary)',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {upload.file?.name || `${req.type} file uploaded`}
                          </p>
                          <a 
                            href={upload.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              fontSize: '0.72rem', 
                              color: 'var(--accent)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            View file <ExternalLink size={10} />
                          </a>
                        </div>
                        {!deadlinePassed && (
                          <button
                            onClick={() => handleFileRemove(upload.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#ef4444';
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--text-muted)';
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Error Message */}
                  {upload?.error && (
                    <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.4rem' }}>
                      {upload.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description & Technologies */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ 
          fontFamily: 'var(--font-display)', 
          fontSize: '0.9rem', 
          fontWeight: 600, 
          color: 'var(--text-primary)',
          marginBottom: '1rem',
        }}>
          Project Details
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Description */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '0.4rem' 
            }}>
              Project Description
            </label>
            <textarea
              className="org-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={deadlinePassed}
              style={{ minHeight: 120, resize: 'vertical' }}
              placeholder="Describe your project, what problem it solves, key features, and what you're proud of..."
            />
          </div>

          {/* Technologies */}
          <div>
            <label style={{ 
              display: 'block',
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '0.4rem' 
            }}>
              Technologies Used
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="org-input"
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                disabled={deadlinePassed}
                placeholder="e.g. React, Python, TensorFlow"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (tech.trim() && !form.technologies.includes(tech.trim())) {
                      setForm((p) => ({ ...p, technologies: [...p.technologies, tech.trim()] }));
                      setTech('');
                    }
                  }
                }}
              />
              <button
                type="button"
                className="org-btn-secondary"
                disabled={deadlinePassed}
                onClick={() => {
                  if (tech.trim() && !form.technologies.includes(tech.trim())) {
                    setForm((p) => ({ ...p, technologies: [...p.technologies, tech.trim()] }));
                    setTech('');
                  }
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
              {form.technologies.map((t) => (
                <span key={t} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.6rem',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(232,164,74,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent)',
                  fontSize: '0.8rem',
                }}>
                  {t}
                  {!deadlinePassed && (
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, technologies: p.technologies.filter((x) => x !== t) }))}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--accent)', 
                        cursor: 'pointer', 
                        fontSize: '1rem', 
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      &times;
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Issues */}
      {issues.length > 0 && (
        <div style={{
          padding: '1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>
            Please fix the following issues:
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
            {issues.map((issue, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: '#ef4444', marginBottom: '0.25rem' }}>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Status */}
      {submission && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem',
          marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Submission Status
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {status === 'healthy' ? (
                <CheckCircle size={16} style={{ color: '#3ecf8e' }} />
              ) : status === 'broken' ? (
                <AlertCircle size={16} style={{ color: '#ef4444' }} />
              ) : (
                <div style={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  border: '2px solid var(--border-default)' 
                }} />
              )}
              <span style={{ 
                fontSize: '0.82rem', 
                color: status === 'healthy' ? '#3ecf8e' : status === 'broken' ? '#ef4444' : 'var(--text-muted)', 
                fontWeight: 600,
                textTransform: 'capitalize',
              }}>
                {status === 'idle' ? 'Not checked' : status}
              </span>
            </div>
            {submission.submittedAt && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Submitted {new Date(submission.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={saveSubmission}
        disabled={deadlinePassed || saving}
        className="org-btn-primary"
        style={{ 
          width: '100%', 
          padding: '0.75rem',
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        {saving ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Saving & Checking...
          </>
        ) : (
          'Save Submission'
        )}
      </button>

      {/* Back Link */}
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          marginTop: '1rem',
          padding: '0.5rem',
          display: 'block',
          width: '100%',
          textAlign: 'center',
        }}
      >
        &larr; Back to Hackathon
      </button>

      {/* Global Styles for Animation */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}