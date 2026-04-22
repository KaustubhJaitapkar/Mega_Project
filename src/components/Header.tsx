'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isChangingRole, setIsChangingRole] = useState(false);

  const roles = ['PARTICIPANT', 'ORGANISER', 'JUDGE', 'MENTOR', 'SPONSOR'];

  async function handleRoleChange(newRole: string) {
    setIsChangingRole(true);
    try {
      const res = await fetch('/api/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        // Update the session in NextAuth
        await update({ role: newRole });
        // Route through central role-aware dashboard redirect
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Failed to change role:', error);
    } finally {
      setIsChangingRole(false);
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {session?.user?.name}
          </h2>
          <p className="text-sm text-gray-600">{session?.user?.email}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Role:</span>
            <select
              value={(session?.user as any)?.role || 'PARTICIPANT'}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={isChangingRole}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <Link
            href="/profile"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
