'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  ArrowRight,
  Award,
  Clock,
  FileCode2,
  MessageSquare,
  Scale,
  Users,
  Zap,
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Team building',
    desc: 'Form or join teams, match on skills, and keep everyone aligned in one workspace.',
    icon: Users,
  },
  {
    title: 'Fair judging',
    desc: 'Rubrics, sealed scores, and clear criteria so great work wins on merit.',
    icon: Scale,
  },
  {
    title: 'Live timeline',
    desc: 'Keynotes, workshops, and checkpoints—always know what is on next.',
    icon: Clock,
  },
  {
    title: 'Submissions',
    desc: 'Repos, demos, and decks with checks so showcases stay credible.',
    icon: FileCode2,
  },
  {
    title: 'Mentorship',
    desc: 'Real-time chat with mentors when teams hit a wall.',
    icon: MessageSquare,
  },
  {
    title: 'Certificates',
    desc: 'Credentials for participants and winners—ready when the event wraps.',
    icon: Award,
  },
] as const;

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text-primary)] antialiased">
      {/* Nav */}
      <header className="fixed top-0 z-50 w-full border-b border-[var(--border-default)] bg-[var(--bg-overlay)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="auth-brand__logo no-underline">
            <div className="auth-brand__logo-mark !h-7 !w-7 !text-[0.8rem]">H</div>
            <span className="font-semibold tracking-tight">Hackmate</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Account">
            <Link
              href="/login"
              className="font-mono text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              Sign in
            </Link>
            <Link href="/signup" className="org-btn-primary min-h-[38px] px-4 py-2 text-xs sm:min-h-[40px] sm:px-5">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[min(100svh,920px)] overflow-hidden pt-[4.5rem]">
        <div className="landing-grid" aria-hidden />
        <div className="landing-grain" aria-hidden />

        <div
          className="pointer-events-none absolute -right-[20%] top-1/4 h-[min(520px,55vw)] w-[min(520px,90vw)] rounded-full bg-[var(--accent)] opacity-[0.09] blur-[100px] motion-safe:animate-[auth-float_10s_ease-in-out_infinite]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-[380px] w-[380px] rounded-full bg-[var(--success)] opacity-[0.07] blur-[90px] motion-safe:animate-[auth-float_10s_ease-in-out_infinite]"
          style={{ animationDelay: '-5s' }}
          aria-hidden
        />

        {/* Diagonal wash */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[var(--accent-dim)] via-transparent to-[rgba(26,127,55,0.06)] opacity-90 dark:to-[rgba(63,185,80,0.05)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-14 px-4 pb-20 pt-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:pt-6">
          <div className="max-w-xl lg:min-w-0 lg:flex-1">
            <p className="landing-rise font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
              The hackathon platform
            </p>
            <h1 className="landing-rise landing-rise-1 mt-5 font-serif text-[clamp(2.25rem,6.5vw,3.85rem)] font-semibold leading-[1.08] tracking-tight text-[var(--text-primary)]">
              One platform for
              <span className="mt-2 block text-[var(--accent)]">Every hackathon need</span>
            </h1>
            <p className="landing-rise landing-rise-2 mt-6 max-w-[28rem] text-[17px] leading-relaxed text-[var(--text-secondary)]">
              Teams, submissions, judging, and mentorship—wired together so organizers run a tight event and builders stay in flow.
            </p>
            <div className="landing-rise landing-rise-3 mt-9 flex flex-wrap items-center gap-3">
              <Link href="/signup" className="org-btn-primary inline-flex min-h-[44px] items-center gap-2 px-6 text-sm no-underline">
                Start building
                <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="org-btn-secondary inline-flex min-h-[44px] items-center px-6 text-sm no-underline"
              >
                Sign in
              </Link>
            </div>
            <p className="landing-rise landing-rise-4 mt-8 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Participants · Organizers · Judges · Mentors
            </p>
          </div>

          {/* Pipeline card — asymmetry + depth */}
          <div className="landing-rise landing-rise-2 w-full max-w-md shrink-0 lg:max-w-[420px]">
            <div className="relative overflow-hidden rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--elevation-sm)]">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-[var(--accent-dim)] blur-2xl" aria-hidden />
              <div className="relative border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  <Zap className="h-4 w-4 text-[var(--accent)]" aria-hidden />
                  Event pipeline
                </div>
              </div>
              <ol className="relative space-y-0 divide-y divide-[var(--border-default)] px-5 py-2">
                {[
                  { step: '01', label: 'Register & team up' },
                  { step: '02', label: 'Build & submit' },
                  { step: '03', label: 'Judge & certify'},
                ].map((row) => (
                  <li key={row.step} className="flex gap-4 py-4">
                    <span className="font-mono text-sm font-bold tabular-nums text-[var(--accent)]">{row.step}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{row.label}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">{row.hint}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features — bento */}
      <section
        className="border-y border-[var(--border-default)] bg-[var(--bg-surface)] py-20 sm:py-24"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Capabilities
            </p>
           
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const isHero = i === 0;
              return (
                <article
                  key={feature.title}
                  className="group relative flex flex-col rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--elevation-sm)] transition-[border-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:shadow-primer-md"
                >
                  <div
                    className={`mb-4 flex items-center justify-center rounded-[6px] border border-[var(--border-default)] bg-[var(--accent-dim)] text-[var(--accent)] transition-colors group-hover:border-[var(--border-accent)] ${isHero ? 'h-14 w-14' : 'h-11 w-11'}`}
                  >
                    <Icon className={isHero ? 'h-7 w-7' : 'h-5 w-5'} strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                  <p
                    className={`mt-2 text-[var(--text-secondary)] ${isHero ? 'text-[15px] leading-relaxed' : 'text-sm leading-relaxed'}`}
                  >
                    {feature.desc}
                  </p>
                  {isHero && (
                    <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                      Your hub for collaboration
                    </p>
                  )}
                  <span className="sr-only">{`Feature ${i + 1} of ${FEATURES.length}`}</span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--accent-dim)] via-transparent to-transparent opacity-70"
          aria-hidden
        />
        <div className="relative z-[1] mx-auto max-w-[720px] text-center">
          <h2 className="font-serif text-[clamp(1.45rem,3.2vw,2rem)] font-semibold tracking-tight text-[var(--text-primary)]">
            Ready when you are
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Create an account, pick your role, and step into your workspace.
          </p>
          <Link
            href="/signup"
            className="org-btn-primary mx-auto mt-8 inline-flex min-h-[46px] items-center gap-2 px-8 text-sm no-underline"
          >
            Create your account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="auth-brand__logo text-[0.95rem]">
            <div className="auth-brand__logo-mark !h-7 !w-7">H</div>
            <span>Hackmate</span>
          </div>
          {/* <p className="text-center font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)] sm:text-left">
            Built for hackers — ship fast, judge fair, celebrate loud.
          </p> */}
          <div className="flex gap-5 font-mono text-[12px]">
            <Link href="/login" className="text-[var(--accent)] no-underline hover:underline">
              Sign in
            </Link>
            <Link href="/signup" className="text-[var(--accent)] no-underline hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
