'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

type HeaderProps = {
  showUserMenu?: boolean;
  onMenuOpen?: () => void;
};

export default function Header({ showUserMenu = true, onMenuOpen }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-end border-b border-[var(--border-default)] bg-[var(--bg-overlay)] backdrop-blur-xl px-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4">
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        {onMenuOpen && (
          <button
            type="button"
            onClick={onMenuOpen}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-default)] text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-raised)] md:hidden"
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        )}

        {onMenuOpen && <div className="min-w-0 flex-1 md:hidden" aria-hidden />}

        <div
          className={`flex min-w-0 items-center justify-end gap-2 sm:gap-3 ${
            onMenuOpen ? 'flex-1 md:flex-none' : 'w-full'
          }`}
        >
          <ThemeToggle compact />
          {showUserMenu && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex max-w-[min(100%,220px)] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] py-1.5 pl-1.5 pr-2.5 text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--border-strong)]"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-dim)] font-display text-[11px] font-bold text-[var(--accent)]">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="hidden min-w-0 truncate text-[13px] font-medium sm:inline">
                  {session?.user?.name}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="var(--text-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="shrink-0"
                >
                  <path d="M3 4.5L6 7.5L9 4.5" />
                </svg>
              </button>

              {showMenu && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close menu"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] py-1 shadow-[var(--shadow-lg)]">
                    <p className="border-b border-[var(--border-subtle)] px-3 py-2 font-mono text-[11px] text-[var(--text-muted)]">
                      {session?.user?.email}
                    </p>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                      onClick={() => {
                        setShowMenu(false);
                        router.push('/profile');
                      }}
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[13px] text-[var(--error)] hover:bg-[var(--error-dim)]"
                      onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
