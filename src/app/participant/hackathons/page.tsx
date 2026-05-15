import { prisma } from '@/lib/prisma';
import ExploreHackathonsClient from './ExploreHackathonsClient';

export default async function ExploreHackathonsPage() {
  const hackathons = await prisma.hackathon.findMany({
    take: 100,
    orderBy: { startDate: 'desc' },
    select: {
      id: true,
      title: true,
      shortDescription: true,
      bannerUrl: true,
      logoUrl: true,
      startDate: true,
      endDate: true,
      location: true,
      isVirtual: true,
      status: true,
      _count: { select: { teams: true, submissions: true } },
    },
  });

  return <ExploreHackathonsClient hackathons={hackathons as any} />;
}
