import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const invite = await prisma.staffInvite.findUnique({
      where: { token: params.token },
      include: { hackathon: true }
    });

    if (!invite || invite.used || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });
    }

    if (!session?.user?.email) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', `/accept-staff-invite/${params.token}`);
      return NextResponse.redirect(loginUrl);
    }

    // Verify the logged-in user's email matches the invite target
    if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite was sent to a different email address' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { role: invite.role },
      }),
      prisma.hackathon.update({
        where: { id: invite.hackathonId },
        data:
          invite.role === 'MENTOR'
            ? { mentors: { connect: { id: user.id } } }
            : { judges: { connect: { id: user.id } } },
      }),
      prisma.staffInvite.update({
        where: { id: invite.id },
        data: { used: true, usedAt: new Date() },
      }),
    ]);

    const dashboardPath = invite.role === 'MENTOR' ? '/mentor/dashboard' : '/judge/dashboard';
    return NextResponse.redirect(new URL(dashboardPath, req.nextUrl.origin));
  } catch (error) {
    console.error('Invite accept error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

