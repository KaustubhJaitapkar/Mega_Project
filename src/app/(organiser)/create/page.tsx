'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import HackathonForm from '@/components/HackathonForm';
import { Rocket, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateHackathonPage() {
  const { data: session } = useSession();
  useEffect(() => {
    if (!session) redirect('/login');
  }, [session]);

  return (
    <div className="hf-create-page">
      <div className="org-page hf-create-inner">
        <header className="hf-create-header">
          <Link href="/organiser/dashboard" className="hf-create-back">
            <ArrowLeft size={16} strokeWidth={2} aria-hidden />
            <span>Dashboard</span>
          </Link>

          <div className="hf-create-heading">
            <p className="hf-create-kicker">
              <span className="hf-create-kicker-icon" aria-hidden>
                <Rocket size={15} strokeWidth={2} />
              </span>
              Organiser
            </p>
            <h1 className="hf-create-title">New hackathon</h1>
            <p className="hf-create-lede">
              Work through each block at your own pace. Nothing is published until you say so—you can
              refine copy, dates, and rubrics before teams ever see them.
            </p>
          </div>
        </header>

        <HackathonForm />
      </div>
    </div>
  );
}
