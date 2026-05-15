'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    const role = (session.user as any)?.role;
    if (role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-root)]">
      <Sidebar role="ADMIN" mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} useMobileDrawer />
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[6px] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)]"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            Admin Panel
          </span>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
