'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface SubmissionFormProps {
  teamId: string;
}

export default function SubmissionForm({ teamId }: SubmissionFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    githubUrl: '',
    liveUrl: '',
    description: '',
    technologies: [] as string[],
  });
  const [techInput, setTechInput] = useState('');
  const [pitchFile, setPitchFile] = useState<File | null>(null);
  const [uploadingPitch, setUploadingPitch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/submissions/${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (pitchFile && data.data?.id) {
          setUploadingPitch(true);
          const uploadForm = new FormData();
          uploadForm.append('file', pitchFile);
          await fetch(`/api/submissions/${data.data.id}/upload`, {
            method: 'POST',
            body: uploadForm,
          });
          setUploadingPitch(false);
        }
        setSuccess('Submission saved successfully!');
        setFormData({ githubUrl: '', liveUrl: '', description: '', technologies: [] });
        setPitchFile(null);
      } else {
        setError(data.error || 'Failed to submit');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  function addTech() {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()],
      }));
      setTechInput('');
    }
  }

  function removeTech(tech: string) {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          GitHub Repository URL
        </label>
        <input
          type="url"
          value={formData.githubUrl}
          onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
          className="input"
          placeholder="https://github.com/username/repo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Live Project URL
        </label>
        <input
          type="url"
          value={formData.liveUrl}
          onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
          className="input"
          placeholder="https://project.example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input min-h-32"
          placeholder="Describe your project, what it does, and any special features"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Technologies Used
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
            placeholder="Add technology (press Enter)"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={addTech}
            className="btn btn-secondary"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.technologies.map((tech) => (
            <div key={tech} className="badge badge-primary flex items-center gap-2">
              {tech}
              <button
                type="button"
                onClick={() => removeTech(tech)}
                className="text-lg cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Pitch Deck (PDF/PPT, max 10MB)
        </label>
        <input
          type="file"
          accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            if (file && file.size > 10 * 1024 * 1024) {
              setError('File size must be under 10MB');
              setPitchFile(null);
              return;
            }
            setPitchFile(file);
            setError('');
          }}
          className="input"
        />
        {pitchFile && (
          <p className="text-xs text-gray-500 mt-1">{pitchFile.name} ({(pitchFile.size / 1024 / 1024).toFixed(1)}MB)</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        {isLoading ? 'Submitting...' : uploadingPitch ? 'Uploading pitch deck...' : 'Submit Project'}
      </button>
    </form>
  );
}
