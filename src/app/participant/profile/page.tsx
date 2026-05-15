import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ParticipantProfileClient from './ParticipantProfileClient';

export default async function ParticipantProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      githubUsername: true,
      profile: {
        select: {
          bio: true,
          skills: true,
          company: true,
          experience: true,
          githubUrl: true,
          linkedinUrl: true,
          resumeUrl: true,
          isPublic: true,
          isLookingForTeam: true,
        },
      },
    },
  });

  if (!user) redirect('/login');

  return (
    <ParticipantProfileClient
      user={{
        name: user.name || '',
        githubUsername: user.githubUsername || '',
        profile: user.profile,
      }}
    />
  );
}
