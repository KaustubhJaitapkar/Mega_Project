import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, isErrorResponse } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const where: any = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [hackathons, total] = await Promise.all([
    prisma.hackathon.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        isPaused: true,
        pausedAt: true,
        pauseReason: true,
        startDate: true,
        endDate: true,
        prize: true,
        createdAt: true,
        organiser: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            teams: true,
            submissions: true,
            registrations: true,
            helpTickets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.hackathon.count({ where }),
  ]);

  return NextResponse.json({ hackathons, total, page, limit });
}
