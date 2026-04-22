'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HackathonForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    submissionDeadline: '',
    maxTeamSize: 5,
    minTeamSize: 1,
    location: '',
    isVirtual: true,
    prize: '',
    rules: '',
  });

  const toISO = (value: string) => (value ? new Date(value).toISOString() : '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.minTeamSize > formData.maxTeamSize) {
      setError('Min team size cannot be greater than max team size');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        startDate: toISO(formData.startDate),
        endDate: toISO(formData.endDate),
        registrationDeadline: toISO(formData.registrationDeadline),
        submissionDeadline: toISO(formData.submissionDeadline),
      };

      const res = await fetch('/api/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/command-center/${data.data.id}`);
      } else {
        const data = await res.json();
        setError(data?.error || 'Failed to create hackathon');
      }
    } catch (error) {
      console.error('Failed to create hackathon:', error);
      setError('Failed to create hackathon');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prize
          </label>
          <input
            type="text"
            value={formData.prize}
            onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
            className="input"
            placeholder="e.g., $10,000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="input min-h-32"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Short Description
        </label>
        <input
          type="text"
          value={formData.shortDescription}
          onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
          className="input"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className="input"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Deadline
          </label>
          <input
            type="datetime-local"
            value={formData.registrationDeadline}
            onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Submission Deadline
          </label>
          <input
            type="datetime-local"
            value={formData.submissionDeadline}
            onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
            className="input"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Team Size
          </label>
          <input
            type="number"
            min="1"
            value={formData.minTeamSize}
            onChange={(e) => setFormData({ ...formData, minTeamSize: parseInt(e.target.value) })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Team Size
          </label>
          <input
            type="number"
            min="1"
            value={formData.maxTeamSize}
            onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) })}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={formData.isVirtual ? 'virtual' : 'in-person'}
            onChange={(e) => setFormData({ ...formData, isVirtual: e.target.value === 'virtual' })}
            className="input"
          >
            <option value="virtual">Virtual</option>
            <option value="in-person">In-Person</option>
          </select>
        </div>
      </div>

      {!formData.isVirtual && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="input"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rules
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
          className="input min-h-24"
          placeholder="Enter hackathon rules and guidelines"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        {isLoading ? 'Creating...' : 'Create Hackathon'}
      </button>
    </form>
  );
}
