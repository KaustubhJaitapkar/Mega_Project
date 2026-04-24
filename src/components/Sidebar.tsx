'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path));

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
      { label: 'Submit', path: '/participant/submit', icon: icons.submit },
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

  const menuItems = menuByRole[role] || [{ label: 'Dashboard', path: '/dashboard', icon: icons.dashboard }];

  return (
    <aside style={{
      width: 240,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1.25rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'var(--accent)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-inverse)',
        }}>
          H
        </div>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Hackmate
        </span>
      </div>

      {/* Nav */}
      <nav style={{
        padding: '1rem 0.75rem',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
      }}>
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-dim)' : 'transparent',
                border: 'none',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--bg-raised)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ opacity: active ? 1 : 0.6, display: 'flex' }}>{item.icon}</span>
              {item.label}
              {active && (
                <div style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  marginLeft: 'auto',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.05em',
        }}>
          {role?.charAt(0) + role?.slice(1).toLowerCase()} view
        </p>
      </div>
    </aside>
  );
}
