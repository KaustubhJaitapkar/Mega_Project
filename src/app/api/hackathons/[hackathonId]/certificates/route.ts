import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCertificate } from '@/lib/certificate';
import { requireOrganizerOf, isErrorResponse } from '@/lib/api-auth';

const VALID_CERT_TYPES = ['PARTICIPANT', 'WINNER', 'RUNNER_UP', 'BEST_PROJECT'] as const;

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const userOrError = await requireOrganizerOf(params.hackathonId);
    if (isErrorResponse(userOrError)) return userOrError;

    const body = await req.json();
    const { userId, type, mode } = body;

    if (type && !VALID_CERT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_CERT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (mode === 'auto') {
      const hackathon = await prisma.hackathon.findUnique({
        where: { id: params.hackathonId },
      });

      if (!hackathon) {
        return NextResponse.json(
          { error: 'Hackathon not found' },
          { status: 404 }
        );
      }

      const teams = await prisma.team.findMany({
        where: { hackathonId: params.hackathonId },
        select: { id: true, name: true, members: { select: { userId: true } } },
      });

      const scores = await prisma.score.findMany({
        where: {
          submission: {
            hackathonId: params.hackathonId,
          },
        },
        include: { submission: { select: { teamId: true } } },
      });

      const totals = new Map<string, number>();
      teams.forEach((team) => totals.set(team.id, 0));
      for (const score of scores) {
        const teamId = score.submission?.teamId;
        if (!teamId) continue;
        totals.set(teamId, (totals.get(teamId) || 0) + score.score);
      }

      const ranking = teams
        .map((team) => ({
          teamId: team.id,
          totalScore: totals.get(team.id) || 0,
          members: team.members,
        }))
        .sort((a, b) => b.totalScore - a.totalScore);

      const winner = ranking[0];
      const runnerUp = ranking[1];

      const participantUserIds = new Set<string>();
      teams.forEach((team) => team.members.forEach((m) => participantUserIds.add(m.userId)));

      const winnerIds = new Set<string>(winner?.members.map((m) => m.userId) || []);
      const runnerIds = new Set<string>(runnerUp?.members.map((m) => m.userId) || []);

      const allUserIds = new Set<string>([...participantUserIds, ...winnerIds, ...runnerIds]);
      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(allUserIds) } },
        select: { id: true, name: true, email: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      const created: any[] = [];

      async function createIfMissing(targetUserId: string, certType: string, teamId?: string) {
        const existing = await prisma.certificate.findFirst({
          where: {
            hackathonId: params.hackathonId,
            userId: targetUserId,
            type: certType as any,
          },
        });
        if (existing) return;

        const user = userMap.get(targetUserId);
        if (!user) return;

        const certificateUrl = await generateCertificate(
          user.name,
          certType as any,
          hackathon.title,
          new Date()
        );

        const certificate = await prisma.certificate.create({
          data: {
            hackathonId: params.hackathonId,
            userId: targetUserId,
            teamId,
            type: certType as any,
            title: `${certType} Certificate - ${hackathon.title}`,
            certificateUrl,
          },
        });
        created.push(certificate);
      }

      if (winner) {
        for (const member of winner.members) {
          await createIfMissing(member.userId, 'WINNER', winner.teamId);
        }
      }

      if (runnerUp) {
        for (const member of runnerUp.members) {
          await createIfMissing(member.userId, 'RUNNER_UP', runnerUp.teamId);
        }
      }

      for (const userId of participantUserIds) {
        await createIfMissing(userId, 'PARTICIPANT');
      }

      return NextResponse.json({
        message: 'Certificates auto-generated',
        data: created,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: {
        hackathonId: params.hackathonId,
        userId,
        type,
      },
    });

    if (existingCert) {
      return NextResponse.json(
        { error: 'Certificate already generated' },
        { status: 400 }
      );
    }

    const certificateUrl = await generateCertificate(
      user.name,
      type,
      hackathon.title,
      new Date()
    );

    const certificate = await prisma.certificate.create({
      data: {
        hackathonId: params.hackathonId,
        userId,
        type,
        title: `${type} Certificate - ${hackathon.title}`,
        certificateUrl,
      },
    });

    return NextResponse.json(
      {
        message: 'Certificate generated successfully',
        data: certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Generate certificate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ data: certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
