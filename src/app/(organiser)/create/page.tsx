'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import HackathonForm from '@/components/HackathonForm';

export default function CreateHackathonPage() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) {
      redirect('/login');
    }
  }, [session]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Create Hackathon</h1>
        <p className="text-gray-600 mt-2">Set up your next event</p>
      </div>

      <div className="card">
        <HackathonForm />
      </div>
    </div>
  );
}
