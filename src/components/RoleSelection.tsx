'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RoleCard from '@/components/RoleCard';
import {
  Users,
  Zap,
  Award,
  Lightbulb,
  Briefcase,
} from 'lucide-react';

const ROLES = [
  {
    value: 'PARTICIPANT',
    title: 'Participant',
    description: 'Join teams, register hackathons, build projects, and compete',
    icon: Users,
    benefits: [
      'Form or join teams',
      'Build innovative projects',
      'Compete for prizes',
      'Network with developers',
    ],
  },
  {
    value: 'ORGANISER',
    title: 'Organiser',
    description: 'Create and manage hackathons',
    icon: Zap,
    benefits: [
      'Create hackathons',
      'Manage teams and submissions',
      'Set evaluation criteria',
      'Award certificates',
    ],
  },
  {
    value: 'JUDGE',
    title: 'Judge',
    description: 'Evaluate projects and score teams',
    icon: Award,
    benefits: [
      'Review submissions',
      'Score projects fairly',
      'Provide feedback',
      'Help select winners',
    ],
  },
  {
    value: 'MENTOR',
    title: 'Mentor',
    description: 'Help teams solve problems',
    icon: Lightbulb,
    benefits: [
      'Guide team development',
      'Offer technical expertise',
      'Share best practices',
      'Support learning',
    ],
  },
  {
    value: 'SPONSOR',
    title: 'Sponsor',
    description: 'Engage with participants and offer prizes',
    icon: Briefcase,
    benefits: [
      'Showcase your brand',
      'Connect with talent',
      'Offer prizes/resources',
      'Build company visibility',
    ],
  },
];

export default function RoleSelection() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>(
    (session?.user as any)?.role || 'PARTICIPANT'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const roleRoutes: Record<string, string> = {
    PARTICIPANT: '/participant/dashboard',
    ORGANISER: '/organiser/dashboard',
    JUDGE: '/judge/dashboard',
    MENTOR: '/mentor/dashboard',
    SPONSOR: '/sponsor/dashboard',
  };

  async function handleConfirm() {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/user/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to set role');
        return;
      }

      setSuccess('Role set successfully!');
      setTimeout(() => {
        router.push(roleRoutes[selectedRole] || '/dashboard');
      }, 500);
    } catch (err) {
      setError('An error occurred while setting your role');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Choose Your Role
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select how you want to participate in Hackmate and unlock role-specific features
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-2xl mx-auto">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg max-w-2xl mx-auto">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {ROLES.map((role) => (
            <RoleCard
              key={role.value}
              role={role.value as any}
              title={role.title}
              description={role.description}
              icon={role.icon}
              benefits={role.benefits}
              isSelected={selectedRole === role.value}
              onClick={() => setSelectedRole(role.value)}
            />
          ))}
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedRole}
            className="btn btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting role...' : 'Continue to Dashboard'}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            You can change your role anytime from the dashboard header
          </p>
        </div>
      </div>
    </div>
  );
}
