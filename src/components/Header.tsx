'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const roles = ['PARTICIPANT', 'ORGANISER', 'JUDGE', 'MENTOR', 'SPONSOR'];
  const currentRole = (session?.user as any)?.role || 'PARTICIPANT';

  async function handleRoleChange(newRole: string) {
    setIsChangingRole(true);
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        await update({ role: newRole });
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to change role:', error);
    } finally {
      setIsChangingRole(false);
    }
  }

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 1.5rem',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      {/* Left: page context */}
      <div>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}>
          {currentRole}
        </p>
      </div>

      {/* Right: user actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Role switcher */}
        <select
          value={currentRole}
          onChange={(e) => handleRoleChange(e.target.value)}
          disabled={isChangingRole}
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            padding: '0.35rem 0.6rem',
            outline: 'none',
            cursor: 'pointer',
            letterSpacing: '0.03em',
          }}
        >
          {roles.map((r) => (
            <option key={r} value={r} style={{ background: 'var(--bg-raised)' }}>
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        {/* User info + menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '0.35rem 0.75rem',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--accent-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: 'var(--accent)',
            }}>
              {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 500,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {session?.user?.name}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 4.5L6 7.5L9 4.5" />
            </svg>
          </button>

          {/* Dropdown */}
          {showMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowMenu(false)} />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '0.4rem',
                minWidth: 180,
                zIndex: 50,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <p style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '0.25rem',
                }}>
                  {session?.user?.email}
                </p>
                <button
                  onClick={() => { setShowMenu(false); router.push('/profile'); }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left' as const,
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Settings
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left' as const,
                    padding: '0.5rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--error)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--error-dim)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
