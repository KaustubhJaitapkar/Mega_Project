'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
interface SidebarProps {
  role: string;
  /** When false on small screens, sidebar is off-canvas */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  /**
   * Organiser (and similar shells): off-canvas nav on small screens, account in footer.
   * When false, legacy sticky sidebar and Profile stays in the main list.
   */
  useMobileDrawer?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function Sidebar({
  role,
  mobileOpen = false,
  onMobileClose,
  useMobileDrawer = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) =>
    pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (
        accountWrapRef.current &&
        !accountWrapRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [accountOpen]);

  const icons = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
    rocket: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
    create: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    scan: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 012-2h2" />
        <path d="M17 3h2a2 2 0 012 2v2" />
        <path d="M21 17v2a2 2 0 01-2 2h-2" />
        <path d="M7 21H5a2 2 0 01-2-2v-2" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </svg>
    ),
    teams: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    submit: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
    schedule: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    cert: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
    profile: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    explore: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  };

  const menuByRole: Record<string, NavItem[]> = {
    PARTICIPANT: [
      { label: 'Dashboard', path: '/participant/dashboard', icon: icons.dashboard },
      { label: 'Explore', path: '/participant/hackathons', icon: icons.explore },
      { label: 'My Team', path: '/participant/my-team', icon: icons.teams },
      { label: 'Schedule', path: '/participant/schedule', icon: icons.schedule },
      { label: 'Certificates', path: '/participant/certificates', icon: icons.cert },
      { label: 'Profile', path: '/participant/profile', icon: icons.profile },
    ],
    ORGANISER: [
      { label: 'Dashboard', path: '/organiser/dashboard', icon: icons.dashboard },
      { label: 'Create Event', path: '/create', icon: icons.create },
      { label: 'QR Scanner', path: '/organiser/scan', icon: icons.scan },
      { label: 'Profile', path: '/profile', icon: icons.profile },
    ],
    JUDGE: [
      { label: 'Dashboard', path: '/judge/dashboard', icon: icons.dashboard },
      { label: 'Profile', path: '/profile', icon: icons.profile },
    ],
    MENTOR: [
      { label: 'Dashboard', path: '/mentor/dashboard', icon: icons.dashboard },
      { label: 'My Teams', path: '/mentor/dashboard', icon: icons.teams },
      { label: 'Profile', path: '/profile', icon: icons.profile },
    ],
    SPONSOR: [
      { label: 'Dashboard', path: '/sponsor/dashboard', icon: icons.dashboard },
      { label: 'Profile', path: '/profile', icon: icons.profile },
    ],
  };

  const menuItems = menuByRole[role] || [
    { label: 'Dashboard', path: '/dashboard', icon: icons.dashboard },
  ];

  const profilePath =
    role === 'PARTICIPANT' ? '/participant/profile' : '/profile';

  /** Profile moves to footer for participant (theme rail) and organiser mobile drawer */
  const navItems = menuItems.filter((item) => {
    if (item.label !== 'Profile') return true;
    if (useMobileDrawer) return false;
    if (role === 'PARTICIPANT') return false;
    return true;
  });

  return (
    <aside
      className={`
        flex min-h-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]
        ${
          useMobileDrawer
            ? `fixed left-0 top-0 z-50 h-full min-h-screen w-[min(260px,88vw)] max-w-[280px] transition-transform duration-200 ease-out md:sticky md:top-0 md:z-auto md:h-screen md:max-w-none md:w-[240px] md:translate-x-0 ${
                mobileOpen
                  ? 'translate-x-0 shadow-[var(--elevation-sm)]'
                  : '-translate-x-full md:translate-x-0'
              }`
            : 'sticky top-0 z-10 h-screen w-[240px] shrink-0'
        }
      `}
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] font-bold text-[var(--text-inverse)]"
            style={{ background: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}
          >
            H
          </div>
          <span
            className="truncate font-semibold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)', fontSize: '0.875rem' }}
          >
            Hackmate
          </span>
          <span
            className="hidden shrink-0 rounded-[6px] border border-[var(--border-accent)] px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--accent)] sm:inline"
            style={{
              background: 'var(--accent-dim)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {role?.charAt(0) + role?.slice(1).toLowerCase()}
          </span>
        </div>
        {useMobileDrawer && onMobileClose && (
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] md:hidden"
            aria-label="Close menu"
            onClick={onMobileClose}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain px-2.5 py-3">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => (useMobileDrawer ? onMobileClose?.() : undefined)}
                className={`flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[0.875rem] no-underline transition-colors ${
                  active
                    ? 'bg-[var(--accent-dim)] font-semibold text-[var(--text-primary)]'
                    : 'font-normal text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className={`flex shrink-0 ${active ? 'opacity-100' : 'opacity-70'}`}>{item.icon}</span>
                <span className="min-w-0 truncate">{item.label}</span>
                {active && (
                  <span className="ml-auto h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
                )}
              </Link>
            );
          })}
        </nav>

        {role === 'PARTICIPANT' && (
          <div className="mt-auto border-t border-[var(--border-subtle)] p-3">
            <Link
              href={profilePath}
              onClick={() => (useMobileDrawer ? onMobileClose?.() : undefined)}
              className={`flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[0.875rem] no-underline transition-colors ${
                isActive(profilePath)
                  ? 'bg-[var(--accent-dim)] font-semibold text-[var(--text-primary)]'
                  : 'font-normal text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className={`flex shrink-0 ${isActive(profilePath) ? 'opacity-100' : 'opacity-70'}`}>
                {icons.profile}
              </span>
              <span className="min-w-0 truncate">Profile</span>
              {isActive(profilePath) && (
                <span className="ml-auto h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden />
              )}
            </Link>
          </div>
        )}

      {useMobileDrawer && (
      <div
        ref={accountWrapRef}
        className="relative mt-auto border-t border-[var(--border-subtle)] p-3"
      >
        <button
          type="button"
          onClick={() => setAccountOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] px-2.5 py-2 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-raised)]"
          aria-expanded={accountOpen}
          aria-haspopup="menu"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold text-[var(--accent)]"
            style={{ background: 'var(--accent-dim)', fontFamily: 'var(--font-display)' }}
          >
            {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8125rem] font-medium text-[var(--text-primary)]">
              {session?.user?.name || 'Account'}
            </p>
            <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">
              Account
            </p>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            strokeLinecap="round"
            className={`shrink-0 transition-transform ${accountOpen ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5L6 7.5L9 4.5" />
          </svg>
        </button>

        {accountOpen && (
          <div
            role="menu"
            className="absolute left-0 right-0 top-full z-[60] mt-1 rounded-[6px] border border-[var(--border-default)] bg-[var(--bg-root)] py-1 shadow-[var(--elevation-sm)]"
          >
            <p className="border-b border-[var(--border-subtle)] px-3 py-2 font-mono text-[11px] text-[var(--text-muted)]">
              {session?.user?.email}
            </p>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-[0.8125rem] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              onClick={() => {
                setAccountOpen(false);
                onMobileClose?.();
                router.push(profilePath);
              }}
            >
              Profile & settings
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-[0.8125rem] text-[var(--error)] hover:bg-[var(--error-dim)]"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      )}
      </div>
    </aside>
  );
}
