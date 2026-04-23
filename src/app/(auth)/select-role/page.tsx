'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

type Role = 'PARTICIPANT' | 'ORGANISER';

export default function SelectRolePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
    } else {
      const currentRole = (session.user as { role?: Role })?.role;
      if (currentRole) {
        setSelectedRole(currentRole);
      }
    }
  }, [session, router]);

  const handleConfirm = useCallback(async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);
    setError('');

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

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, router]);

  if (!session) return null;

  return (
    <div className="auth-form">
      <div className="auth-form__header auth-animate-in">
        <p className="auth-form__subtitle">One more step</p>
        <h1 className="auth-form__title">Choose your role</h1>
        <p className="auth-form__title-desc">
          Select how you want to use Hackmate
        </p>
      </div>

      {error && (
        <div className="auth-error auth-animate-in">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11" r="0.75" fill="currentColor" />
          </svg>
          {error}
        </div>
      )}

      <div className="auth-animate-in auth-animate-in-delay-1">
        <div className="auth-role-grid" style={{ marginBottom: '1.5rem' }}>
          <div
            className={`auth-role-card ${selectedRole === 'PARTICIPANT' ? 'auth-role-card--selected' : ''}`}
            onClick={() => setSelectedRole('PARTICIPANT')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedRole('PARTICIPANT')}
          >
            <div className="auth-role-card__check">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="auth-role-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <p className="auth-role-card__name">Participant</p>
            <p className="auth-role-card__desc">Join hackathons, form teams, and build projects</p>
          </div>

          <div
            className={`auth-role-card ${selectedRole === 'ORGANISER' ? 'auth-role-card--selected' : ''}`}
            onClick={() => setSelectedRole('ORGANISER')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedRole('ORGANISER')}
          >
            <div className="auth-role-card__check">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="auth-role-card__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <p className="auth-role-card__name">Organiser</p>
            <p className="auth-role-card__desc">Create and manage hackathon events</p>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={isLoading || !selectedRole}
          className="auth-btn"
        >
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              Setting up
            </>
          ) : (
            'Continue to dashboard'
          )}
        </button>

        <button
          onClick={() => router.push('/dashboard')}
          className="auth-btn-social"
          style={{ marginTop: '0.65rem' }}
        >
          Skip for now
        </button>
      </div>

      <div className="auth-footer auth-animate-in auth-animate-in-delay-2">
        You can change your role later from settings
      </div>
    </div>
  );
}
