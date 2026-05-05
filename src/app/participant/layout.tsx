import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Fraunces, Sora } from 'next/font/google';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './participant.css';

const ptUi = Sora({
  subsets: ['latin'],
  variable: '--font-pt-ui',
  weight: ['400', '500', '600', '700'],
});

const ptDisplay = Fraunces({
  subsets: ['latin'],
  variable: '--font-pt-display',
});

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
    <div className={`${ptUi.variable} ${ptDisplay.variable} ${ptUi.className}`} data-participant-app>
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
