'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div style={{ background: 'var(--bg-root)', minHeight: '100vh' }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        background: 'rgba(8, 8, 10, 0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div className="auth-brand__logo" style={{ fontSize: '1rem' }}>
            <div className="auth-brand__logo-mark" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>H</div>
            <span>Hackmate</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link
              href="/login"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                fontSize: '0.78rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                padding: '0.5rem 1rem',
                transition: 'color 0.15s',
              }}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="auth-btn"
              style={{
                width: 'auto',
                padding: '0.55rem 1.25rem',
                fontSize: '0.78rem',
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 2rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div className="auth-grid-bg" />
        <div className="auth-orb auth-orb--1" style={{ width: 500, height: 500, top: '-150px', right: '-100px' }} />
        <div className="auth-orb auth-orb--2" style={{ width: 350, height: 350, bottom: '-100px', left: '-50px' }} />

        <div style={{ textAlign: 'center', maxWidth: '720px', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--accent)',
            marginBottom: '1.5rem',
          }}>
            The hackathon platform
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '1.5rem',
          }}>
            Build what{' '}
            <span style={{ color: 'var(--accent)' }}>matters.</span>
          </h1>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            maxWidth: '520px',
            margin: '0 auto 2.5rem',
          }}>
            Form teams, build projects, and compete in hackathons — all in one
            platform designed for developers who ship.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/signup"
              className="auth-btn"
              style={{ width: 'auto', padding: '0.9rem 2rem' }}
            >
              Start building
            </Link>
            <Link
              href="/login"
              className="auth-btn-social"
              style={{ width: 'auto', padding: '0.9rem 2rem' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '6rem 2rem',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--accent)',
            textAlign: 'center',
            marginBottom: '0.75rem',
          }}>
            Features
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            marginBottom: '4rem',
          }}>
            Everything you need to hack
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {[
              {
                title: 'Team Building',
                desc: 'Form or join teams, discover teammates by skill match, and collaborate with built-in tools.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                ),
              },
              {
                title: 'Fair Judging',
                desc: 'Transparent evaluation with customizable rubrics, weighted scoring, and sealed reviews.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                ),
              },
              {
                title: 'Live Timeline',
                desc: 'Real-time schedule management with keynotes, workshops, and automated status updates.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                ),
              },
              {
                title: 'Submissions',
                desc: 'Submit projects with GitHub links, live demos, and pitch decks. Health checks keep things running.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                ),
              },
              {
                title: 'Mentorship',
                desc: 'Connect teams with mentors via real-time chat. Get unstuck fast with expert guidance.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                ),
              },
              {
                title: 'Certificates',
                desc: 'Auto-generate certificates for participants, winners, and special achievements.',
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M7 8h10" />
                    <path d="M7 12h6" />
                    <path d="M7 16h8" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                style={{
                  padding: '1.5rem',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'border-color 0.2s',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        padding: '6rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '1rem',
        }}>
          Ready to build?
        </h2>
        <p style={{
          fontSize: '1.05rem',
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
        }}>
          Join thousands of developers shipping great projects.
        </p>
        <Link
          href="/signup"
          className="auth-btn"
          style={{ width: 'auto', padding: '0.9rem 2.5rem', display: 'inline-flex' }}
        >
          Create your account
        </Link>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          Hackmate — Built for hackers, by hackers.
        </p>
      </footer>
    </div>
  );
}
