import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ParticipantDashboardClient from './ParticipantDashboardClient';

export default async function ParticipantDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!user) redirect('/login');

  const firstName = user.name?.split(/\s+/)[0] ?? 'there';

  const [hackathons, registrations] = await Promise.all([
    prisma.hackathon.findMany({
      take: 50,
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        status: true,
        startDate: true,
        endDate: true,
        location: true,
        isVirtual: true,
        submissionDeadline: true,
        registrationDeadline: true,
      },
    }),
    prisma.hackathonRegistration.findMany({
      where: { userId: user.id },
      select: { hackathonId: true },
    }),
  ]);

  const registeredIds = registrations.map((r) => r.hackathonId);

  return (
    <ParticipantDashboardClient
      firstName={firstName}
      hackathons={hackathons as any}
      registeredIds={registeredIds}
    />
  );
}
