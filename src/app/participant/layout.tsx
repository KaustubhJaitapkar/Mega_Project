import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './participant.css';

export default async function ParticipantSegmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = (session.user as any)?.role;
  if (role !== 'PARTICIPANT') redirect('/dashboard');

  return (
    <div data-participant-app>
      <div className="flex min-h-screen bg-[var(--bg-root)]">
        <Sidebar role={role} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="participant-main flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
