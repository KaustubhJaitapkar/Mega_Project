import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import OrganiserShell from '@/components/OrganiserShell';

export const metadata: Metadata = {
  title: 'Organizer - Hackmate',
};

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if ((session.user as any).role !== 'ORGANISER') redirect('/dashboard');

  return (
    <OrganiserShell role={(session.user as any).role}>{children}</OrganiserShell>
  );
}
