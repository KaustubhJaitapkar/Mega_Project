import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import OrganiserShell from '@/components/OrganiserShell';

export default async function OrganiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if ((session.user as any).role !== 'ORGANISER') {
    redirect('/dashboard');
  }

  return (
    <OrganiserShell role={(session.user as any).role}>{children}</OrganiserShell>
  );
}
