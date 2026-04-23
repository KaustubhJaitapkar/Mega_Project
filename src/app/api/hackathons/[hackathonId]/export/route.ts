import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email } });
    const hackathon = await prisma.hackathon.findUnique({ where: { id: params.hackathonId } });
    if (!actor || !hackathon || hackathon.organiserId !== actor.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const registrations = await prisma.hackathonRegistration.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const teams = await prisma.team.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        submission: {
          select: { status: true, isHealthy: true },
        },
      },
    });

    const attendances = await prisma.attendance.findMany({
      where: { hackathonId: params.hackathonId },
    });

    const teamMap = new Map<string, { teamName: string; submissionStatus: string }>();
    teams.forEach((t) => {
      t.members.forEach((m) => {
        teamMap.set(m.userId, {
          teamName: t.name,
          submissionStatus: t.submission?.status || 'NOT_SUBMITTED',
        });
      });
    });

    const attendanceMap = new Map<string, typeof attendances[0]>();
    attendances.forEach((a) => attendanceMap.set(a.userId, a));

    const csvRows = [
      'Name,Email,Team,Submission Status,Checked In,Lunch Redeemed,Swag Collected',
    ];

    for (const reg of registrations) {
      const userId = reg.user?.id || '';
      const team = teamMap.get(userId);
      const att = attendanceMap.get(userId);

      csvRows.push([
        `"${reg.user?.name || reg.firstName || ''}"`,
        `"${reg.user?.email || reg.email || ''}"`,
        `"${team?.teamName || 'No Team'}"`,
        team?.submissionStatus || 'NOT_SUBMITTED',
        att?.checkInTime ? 'Yes' : 'No',
        att?.lunchRedeemed ? 'Yes' : 'No',
        att?.swagCollected ? 'Yes' : 'No',
      ].join(','));
    }

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${hackathon.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
