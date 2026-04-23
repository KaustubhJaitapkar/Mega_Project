import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Authentication — Hackmate',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="auth-split">
      {/* Brand Panel */}
      <div className="auth-brand">
        <div className="auth-grid-bg" />
        <div className="auth-orb auth-orb--1" />
        <div className="auth-orb auth-orb--2" />

        <Link href="/" className="auth-brand__logo">
          <div className="auth-brand__logo-mark">H</div>
          <span>Hackmate</span>
        </Link>

        <div className="auth-brand__content">
          <h1 className="auth-brand__title">
            Build what <span>matters.</span>
          </h1>
          <p className="auth-brand__desc">
            The hackathon platform for developers who ship. Form teams, build
            projects, and compete — all in one place.
          </p>
        </div>

        <div className="auth-brand__stats">
          <div className="auth-brand__stat">
            <span className="auth-brand__stat-value">2.4k+</span>
            <span className="auth-brand__stat-label">Hackers</span>
          </div>
          <div className="auth-brand__stat">
            <span className="auth-brand__stat-value">180+</span>
            <span className="auth-brand__stat-label">Events</span>
          </div>
          <div className="auth-brand__stat">
            <span className="auth-brand__stat-value">$50k</span>
            <span className="auth-brand__stat-label">In Prizes</span>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="auth-form-panel">
        {children}
      </div>
    </div>
  );
}
