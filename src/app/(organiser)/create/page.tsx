'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import HackathonForm from '@/components/HackathonForm';

export default function CreateHackathonPage() {
  const { data: session } = useSession();
  useEffect(() => { if (!session) redirect('/login'); }, [session]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.4rem' }}>
          Organiser
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Create Hackathon
        </h1>
        <p className="org-text" style={{ marginTop: '0.35rem' }}>Fill in the details step by step. You can always edit later.</p>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <HackathonForm />
      </div>
    </div>
  );
}
