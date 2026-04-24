import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function DashboardRouterPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const role = (session.user as any)?.role || 'PARTICIPANT';

  if (role === 'ORGANISER') {
    redirect('/organiser/dashboard');
  }

  if (role === 'JUDGE') {
    redirect('/judge/dashboard');
  }

  if (role === 'MENTOR') {
    redirect('/mentor/dashboard');
  }

  if (role === 'SPONSOR') {
    redirect('/sponsor/dashboard');
  }

  redirect('/participant/dashboard');
}
