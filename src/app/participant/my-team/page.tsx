import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import MyTeamClient from './MyTeamClient';

async function getInitialData(hackathonId?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      profile: { select: { skills: true } },
    },
  });
  if (!user) return null;

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    select: {
      team: {
        select: {
          hackathonId: true,
          hackathon: { select: { id: true, title: true, status: true } },
        },
      },
    },
  });

  const hackathonMap = new Map<string, { id: string; title: string; status: string }>();
  for (const m of memberships) {
    const h = m.team.hackathon;
    if (!hackathonMap.has(h.id)) hackathonMap.set(h.id, h);
  }
  const hackathons = Array.from(hackathonMap.values());

  let registrationStatus: Record<string, boolean> = {};
  let teamsForHackathon: any[] = [];

  if (hackathonId) {
    if (!hackathonMap.has(hackathonId)) {
      const extra = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        select: { id: true, title: true, status: true },
      });
      if (extra) hackathons.push(extra);
    }

    const [reg, teams] = await Promise.all([
      prisma.hackathonRegistration.findFirst({
        where: { hackathonId, userId: user.id },
        select: { id: true },
      }),
      prisma.team.findMany({
        where: { hackathonId },
        select: {
          id: true,
          name: true,
          description: true,
          creatorId: true,
          isOpen: true,
          maxMembers: true,
          members: {
            select: {
              id: true,
              role: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    registrationStatus[hackathonId] = !!reg;
    teamsForHackathon = teams;
  }

  return {
    userId: user.id,
    userName: user.name,
    userSkills: user.profile?.skills || [],
    hackathons,
    initialHackathonId: hackathonId || '',
    registrationStatus,
    teamsForHackathon,
  };
}

export default async function MyTeamPage({
  searchParams,
}: {
  searchParams: { hackathonId?: string; inviteRequestId?: string };
}) {
  const data = await getInitialData(searchParams.hackathonId);
  if (!data) redirect('/login');

  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent)]" /></div>}>
      <MyTeamClient
        userId={data.userId}
        userName={data.userName}
        userSkills={data.userSkills}
        hackathons={data.hackathons}
        initialHackathonId={data.initialHackathonId}
        inviteRequestId={searchParams.inviteRequestId || ''}
        registrationStatus={data.registrationStatus}
        teamsForHackathon={data.teamsForHackathon}
      />
    </Suspense>
  );
}
