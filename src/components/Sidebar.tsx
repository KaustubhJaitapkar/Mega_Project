'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  role: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  const menuByRole: Record<string, Array<{ label: string; path: string }>> = {
    PARTICIPANT: [
      { label: 'Dashboard', path: '/participant/dashboard' },
      { label: 'Explore Hackathons', path: '/participant/hackathons' },
      { label: 'My Team', path: '/participant/my-team' },
      { label: 'Submit', path: '/participant/submit' },
      { label: 'Schedule', path: '/participant/schedule' },
      { label: 'Profile', path: '/participant/profile' },
    ],
    ORGANISER: [
      { label: 'Dashboard', path: '/organiser/dashboard' },
      { label: 'Create Hackathon', path: '/organiser/create' },
      { label: 'Profile', path: '/profile' },
    ],
    JUDGE: [
      { label: 'Dashboard', path: '/judge/dashboard' },
      { label: 'Profile', path: '/profile' },
    ],
    MENTOR: [
      { label: 'Dashboard', path: '/mentor/dashboard' },
      { label: 'Profile', path: '/profile' },
    ],
    SPONSOR: [
      { label: 'Dashboard', path: '/sponsor/dashboard' },
      { label: 'Role Selection', path: '/role-selection' },
      { label: 'Profile', path: '/profile' },
    ],
  };

  const menuItems = menuByRole[role] || [{ label: 'Dashboard', path: '/dashboard' }];

  return (
    <aside className="w-64 bg-indigo-900 text-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Hackmate</h1>
      </div>

      <nav className="space-y-2 px-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`block px-4 py-2 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-indigo-700 text-white'
                : 'text-indigo-100 hover:bg-indigo-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
