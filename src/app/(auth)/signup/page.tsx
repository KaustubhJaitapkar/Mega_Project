'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

type Role = 'PARTICIPANT' | 'ORGANISER';

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const router = useRouter();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address';
    }

    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!role) {
      errors.role = 'Select a role to continue';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, email, password, confirmPassword, role]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Account creation failed');
        return;
      }

      const signInResult = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [name, email, password, role, validate, router]);

  const handleOAuthSignIn = useCallback(async (provider: 'github' | 'google') => {
    setError('');
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: '/dashboard' });
    } catch {
      setError('Authentication failed. Please try again.');
      setLoadingProvider(null);
    }
  }, []);

  return (
    <div className="auth-form">
      <div className="auth-form__header auth-animate-in">
        <p className="auth-form__subtitle">Get started</p>
        <h1 className="auth-form__title">Create an account</h1>
        <p className="auth-form__title-desc">
          Join the community and start building
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

      <div className="auth-animate-in auth-animate-in-delay-1" style={{ display: 'flex', gap: '0.65rem' }}>
        <button
          onClick={() => handleOAuthSignIn('github')}
          disabled={!!loadingProvider}
          className="auth-btn-social"
          style={{ flex: 1, padding: '0.6rem' }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          {loadingProvider === 'github' ? 'Connecting...' : 'GitHub'}
        </button>

        <button
          onClick={() => handleOAuthSignIn('google')}
          disabled={!!loadingProvider}
          className="auth-btn-social"
          style={{ flex: 1, padding: '0.6rem' }}
        >
          <svg viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {loadingProvider === 'google' ? 'Connecting...' : 'Google'}
        </button>
      </div>

      <div className="auth-divider auth-animate-in auth-animate-in-delay-1">
        <span className="auth-divider__line" />
        <span className="auth-divider__text">Or continue with email</span>
        <span className="auth-divider__line" />
      </div>

      <form onSubmit={handleSubmit} className="auth-animate-in auth-animate-in-delay-2">
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`auth-field__input ${fieldErrors.name ? 'auth-field__input--error' : ''}`}
            placeholder="Ada Lovelace"
            autoComplete="name"
            required
          />
          {fieldErrors.name && <p className="auth-field__error">{fieldErrors.name}</p>}
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-email">Email address</label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`auth-field__input ${fieldErrors.email ? 'auth-field__input--error' : ''}`}
            placeholder="ada@example.com"
            autoComplete="email"
            required
          />
          {fieldErrors.email && <p className="auth-field__error">{fieldErrors.email}</p>}
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`auth-field__input ${fieldErrors.password ? 'auth-field__input--error' : ''}`}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
            required
          />
          {password.length > 0 && (
            <div className="auth-password-strength">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`auth-password-strength__bar ${
                    passwordStrength >= level ? `auth-password-strength__bar--${level}` : ''
                  }`}
                />
              ))}
            </div>
          )}
          {fieldErrors.password && <p className="auth-field__error">{fieldErrors.password}</p>}
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`auth-field__input ${fieldErrors.confirmPassword ? 'auth-field__input--error' : ''}`}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            required
          />
          {fieldErrors.confirmPassword && <p className="auth-field__error">{fieldErrors.confirmPassword}</p>}
        </div>

        <div className="auth-field" style={{ marginBottom: '1.5rem' }}>
          <p className="auth-field__label">Profile Type</p>
          <div className="auth-role-grid" style={{ marginBottom: 0 }}>
            <div
              className={`auth-role-card ${role === 'PARTICIPANT' ? 'auth-role-card--selected' : ''}`}
              onClick={() => setRole('PARTICIPANT')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setRole('PARTICIPANT');
                }
              }}
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <div className="auth-role-card__check" style={{ top: '0.4rem', right: '0.4rem' }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="auth-role-card__icon" style={{ marginBottom: '0.5rem', width: '32px', height: '32px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <p className="auth-role-card__name" style={{ fontSize: '0.75rem', marginBottom: '0.1rem' }}>Participant</p>
            </div>

            <div
              className={`auth-role-card ${role === 'ORGANISER' ? 'auth-role-card--selected' : ''}`}
              onClick={() => setRole('ORGANISER')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setRole('ORGANISER');
                }
              }}
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}
            >
              <div className="auth-role-card__check" style={{ top: '0.4rem', right: '0.4rem' }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="auth-role-card__icon" style={{ marginBottom: '0.5rem', width: '32px', height: '32px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <p className="auth-role-card__name" style={{ fontSize: '0.75rem', marginBottom: '0.1rem' }}>Organiser</p>
            </div>
          </div>
          {fieldErrors.role && <p className="auth-field__error">{fieldErrors.role}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="auth-btn"
          style={{ marginTop: '0.5rem' }}
        >
          {isLoading ? (
            <>
              <span className="auth-spinner" />
              Creating account
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <div className="auth-footer auth-animate-in auth-animate-in-delay-3">
        Already have an account?{' '}
        <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}
