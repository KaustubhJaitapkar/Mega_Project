import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function GET() {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalHackathons,
    activeHackathons,
    totalRegistrations,
    totalSubmissions,
    totalTeams,
    bannedUsers,
    newUsersWeek,
    newUsersMonth,
    usersByRole,
    hackathonsByStatus,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.hackathon.count(),
    prisma.hackathon.count({ where: { status: 'ONGOING' } }),
    prisma.hackathonRegistration.count(),
    prisma.submission.count(),
    prisma.team.count(),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
    prisma.hackathon.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    totalHackathons,
    activeHackathons,
    totalRegistrations,
    totalSubmissions,
    totalTeams,
    bannedUsers,
    newUsersWeek,
    newUsersMonth,
    usersByRole: usersByRole.map((r) => ({ role: r.role, count: r._count.id })),
    hackathonsByStatus: hackathonsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
    recentActivity,
  });
}
