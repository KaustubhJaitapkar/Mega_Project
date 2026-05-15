'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import HackathonForm from '@/components/HackathonForm';
import Link from 'next/link';

export default function CreateHackathonPage() {
  const { data: session } = useSession();
  useEffect(() => {
    if (!session) redirect('/login');
  }, [session]);

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[900px] px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/organiser/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <header className="mb-8 border-b border-[var(--border-default)] pb-6">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-[1px] w-6 bg-[var(--accent)]" />
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
              Organiser
            </p>
          </div>
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,1.85rem)] font-bold tracking-tight text-[var(--text-primary)]">
            New hackathon
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[var(--text-secondary)]">
            Work through each block at your own pace. Nothing is published until you say so — you can
            refine copy, dates, and rubrics before teams ever see them.
          </p>
        </header>

        <HackathonForm />
      </div>
    </div>
  );
}
