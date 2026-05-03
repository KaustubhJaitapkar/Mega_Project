'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SelectRolePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.replace('/login');
    } else {
      // Redirect to the improved role selection page
      router.replace('/role-selection');
    }
  }, [session, status, router]);

  return (
    <div className="auth-form">
      <div className="auth-form__header auth-animate-in">
        <p className="auth-form__subtitle">Redirecting...</p>
        <h1 className="auth-form__title">Choose your role</h1>
        <p className="auth-form__title-desc">
          Taking you to role selection
        </p>
      </div>
    </div>
  );
}
