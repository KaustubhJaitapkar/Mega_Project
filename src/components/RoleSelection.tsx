'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import RoleCard from '@/components/RoleCard';
import { Users, Zap } from 'lucide-react';
import Link from 'next/link';

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
    description: 'Create and manage hackathons from start to finish',
    icon: Zap,
    benefits: [
      'Create hackathons',
      'Manage teams and submissions',
      'Set evaluation criteria',
      'Award certificates',
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
    } catch {
      setError('An error occurred while setting your role');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-root)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border-default)] bg-[var(--bg-overlay)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[14px] font-bold text-[var(--text-inverse)]">
              H
            </div>
            <span className="font-display text-[16px] font-bold tracking-tight text-[var(--text-primary)]">
              Hackmate
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[760px]">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-[1px] w-6 bg-[var(--accent)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                Welcome aboard
              </span>
              <div className="h-[1px] w-6 bg-[var(--accent)]" />
            </div>
            <h1 className="font-display text-[clamp(2rem,4vw,2.8rem)] font-bold leading-tight tracking-tight text-[var(--text-primary)] mb-3">
              Choose your role
            </h1>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-lg mx-auto leading-relaxed">
              Select how you want to participate in Hackmate. You can change this later from your dashboard.
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="auth-error mb-6 max-w-2xl mx-auto">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="org-feedback org-feedback-success mb-6 max-w-2xl mx-auto">
              {success}
            </div>
          )}

          {/* Role cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleConfirm}
              disabled={isLoading || !selectedRole}
              className="auth-btn"
              style={{ maxWidth: '320px', width: '100%' }}
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" />
                  Setting role...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </button>

            <p className="text-[13px] text-[var(--text-muted)]">
              You can change your role anytime from the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
