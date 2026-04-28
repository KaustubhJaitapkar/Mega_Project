import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Judging - Hackmate',
};

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if ((session.user as any).role !== 'JUDGE' && (session.user as any).role !== 'MENTOR') {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-auto">
      <div className="flex-1 flex flex-col overflow-auto">
        {children}
      </div>
    </div>
  );
}
