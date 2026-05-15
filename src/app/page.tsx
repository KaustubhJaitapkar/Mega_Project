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
    desc: 'Keynotes, workshops, and checkpoints — always know what is on next.',
    icon: Clock,
  },
  {
    title: 'Submissions',
    desc: 'Repos, demos, and decks with validation so showcases stay credible.',
    icon: FileCode2,
  },
  {
    title: 'Mentorship',
    desc: 'Real-time chat with mentors when teams hit a wall.',
    icon: MessageSquare,
  },
  {
    title: 'Certificates',
    desc: 'Credentials for participants and winners — ready when the event wraps.',
    icon: Award,
  },
] as const;

const STEPS = [
  { step: '01', label: 'Register & team up', desc: 'Create your profile and find teammates' },
  { step: '02', label: 'Build & submit', desc: 'Ship your project before the deadline' },
  { step: '03', label: 'Judge & certify', desc: 'Fair evaluation and instant credentials' },
];

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
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent)] text-[14px] font-bold text-[var(--text-inverse)]">
              H
            </div>
            <span className="font-display text-[16px] font-bold tracking-tight text-[var(--text-primary)]">
              Hackmate
            </span>
          </Link>
          <nav className="flex items-center gap-2.5 sm:gap-3" aria-label="Account">
            <Link
              href="/login"
              className="text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="btn btn-primary !min-h-[36px] !px-4 !py-2 !text-[13px] sm:!min-h-[38px] sm:!px-5"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[min(100svh,900px)] overflow-hidden pt-[4.5rem]">
        {/* Background effects */}
        <div className="landing-grid" aria-hidden />
        <div className="landing-grain" aria-hidden />

        {/* Glow orbs */}
        <div
          className="pointer-events-none absolute -right-[10%] top-1/4 h-[min(400px,45vw)] w-[min(400px,80vw)] rounded-full bg-[var(--accent)] opacity-[0.06] blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-[280px] w-[280px] rounded-full bg-[var(--accent-warm)] opacity-[0.04] blur-[80px]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-12 px-5 pb-20 pt-14 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16 lg:pt-10">
          {/* Left: Copy */}
          <div className="max-w-xl lg:min-w-0 lg:flex-1">
            <div className="landing-rise flex items-center gap-2 mb-6">
              <div className="h-[1px] w-8 bg-[var(--accent)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                The hackathon platform
              </span>
            </div>
            <h1 className="landing-rise landing-rise-1 font-display text-[clamp(2.5rem,6.5vw,4.2rem)] font-bold leading-[1.05] tracking-tight text-[var(--text-primary)]">
              One platform for
              <span className="mt-1 block text-[var(--accent)]">every hackathon need</span>
            </h1>
            <p className="landing-rise landing-rise-2 mt-6 max-w-[28rem] text-[16px] leading-[1.7] text-[var(--text-secondary)]">
              Teams, submissions, judging, and mentorship — wired together so organizers run a tight event and builders stay in flow.
            </p>
            <div className="landing-rise landing-rise-3 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="btn btn-primary btn-lg inline-flex items-center gap-2 no-underline"
              >
                Start building
                <ArrowRight className="h-4 w-4 opacity-90" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="btn btn-secondary btn-lg inline-flex no-underline"
              >
                Sign in
              </Link>
            </div>
            <p className="landing-rise landing-rise-4 mt-10 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Participants · Organizers · Judges · Mentors
            </p>
          </div>

          {/* Right: Pipeline card */}
          <div className="landing-rise landing-rise-2 w-full max-w-md shrink-0 lg:max-w-[400px]">
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]">
              {/* Accent line at top */}
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent)] to-transparent" aria-hidden />

              <div className="relative border-b border-[var(--border-subtle)] px-5 py-4">
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  <Zap className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
                  Event pipeline
                </div>
              </div>

              <ol className="relative space-y-0 divide-y divide-[var(--border-subtle)] px-5 py-1">
                {STEPS.map((row) => (
                  <li key={row.step} className="flex gap-4 py-4">
                    <span className="font-mono text-[12px] font-bold tabular-nums text-[var(--accent)]">
                      {row.step}
                    </span>
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {row.label}
                      </p>
                      <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
                        {row.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="border-y border-[var(--border-default)] bg-[var(--bg-surface)] py-20 sm:py-24"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-[1px] w-6 bg-[var(--accent)]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Capabilities
              </span>
              <div className="h-[1px] w-6 bg-[var(--accent)]" />
            </div>
            <h2
              id="features-heading"
              className="font-display text-[clamp(1.5rem,3.5vw,2.2rem)] font-bold leading-tight tracking-tight text-[var(--text-primary)]"
            >
              Everything you need to run a successful hackathon
            </h2>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-root)] p-5 transition-all duration-200 hover:border-[var(--accent)] hover:shadow-[var(--shadow-glow)]"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent)] transition-all duration-200 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent-dim)]">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="font-display text-[15px] font-bold text-[var(--text-primary)]">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                    {feature.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-12">
            {[
              { value: '500+', label: 'Hackathons hosted' },
              { value: '12k+', label: 'Participants' },
              { value: '98%', label: 'Satisfaction rate' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-none tracking-tight text-[var(--text-primary)]">
                  {stat.value}
                </p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-[var(--border-default)] px-5 py-20 sm:px-8 sm:py-24">
        {/* Background glow */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--accent-dim)] via-transparent to-transparent opacity-50"
          aria-hidden
        />
        <div className="relative z-[1] mx-auto max-w-[600px] text-center">
          <h2 className="font-display text-[clamp(1.5rem,3.5vw,2rem)] font-bold leading-tight tracking-tight text-[var(--text-primary)]">
            Ready when you are
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Create an account, pick your role, and step into your workspace.
          </p>
          <Link
            href="/signup"
            className="btn btn-primary btn-lg mx-auto mt-8 inline-flex items-center gap-2 no-underline"
          >
            Create your account
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[28px] w-[28px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] text-[11px] font-bold text-[var(--text-inverse)]">
              H
            </div>
            <span className="font-display text-[14px] font-bold text-[var(--text-primary)]">Hackmate</span>
          </div>
          <div className="flex gap-5 font-mono text-[11px]">
            <Link href="/login" className="text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--accent)]">
              Sign in
            </Link>
            <Link href="/signup" className="text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--accent)]">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
