import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendTeamInvitation } from '@/lib/email';

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inviter = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!inviter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: { id: true, name: true, creatorId: true, hackathonId: true },
    });
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }
    if (team.creatorId !== inviter.id) {
      return NextResponse.json({ error: 'Only team lead can invite teammates' }, { status: 403 });
    }

    const body = await req.json();
    const email = (body?.email || '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return NextResponse.json(
        { error: 'Invitee must have a Hackmate participant account before email invite can be accepted' },
        { status: 400 }
      );
    }

    const inviteRequest = await prisma.joinRequest.upsert({
      where: { teamId_userId: { teamId: team.id, userId: invitee.id } },
      create: {
        teamId: team.id,
        userId: invitee.id,
        requestedById: inviter.id,
      },
      update: {
        status: 'PENDING',
        requestedById: inviter.id,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const acceptLink = `${baseUrl}/participant/my-team?hackathonId=${team.hackathonId}&inviteRequestId=${inviteRequest.id}`;

    await sendTeamInvitation(email, team.name, inviter.name || 'A teammate', acceptLink);

    return NextResponse.json({ message: 'Invitation email sent successfully' });
  } catch (error) {
    console.error('Send team invite error:', error);
    const smtpAuthError =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as any).code === 'EAUTH';
    const smtpConnectionError =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as any).code === 'ESOCKET';

    return NextResponse.json(
      {
        error: smtpAuthError
          ? 'SMTP authentication failed. Check EMAIL/SMTP credentials (for Gmail, use an App Password).'
          : smtpConnectionError
            ? 'SMTP connection failed. Check SMTP_HOST/SMTP_PORT and ensure the mail server is reachable.'
            : 'Failed to send invitation email',
      },
      { status: 500 }
    );
  }
}

