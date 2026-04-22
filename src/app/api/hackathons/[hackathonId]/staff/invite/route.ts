import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMentorJudgeInvite } from '@/lib/email';
import crypto from 'crypto';

export async function POST(
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

    const { email, role } = await req.json();
    if (!email || !['JUDGE', 'MENTOR'].includes(role)) {
      return NextResponse.json({ error: 'email and valid role (JUDGE/MENTOR) required' }, { status: 400 });
    }

    // Check if invite already exists
    const existingInvite = await prisma.staffInvite.findUnique({
      where: { hackathonId_email: { hackathonId: params.hackathonId, email } }
    });
    if (existingInvite) {
      if (existingInvite.used) {
        return NextResponse.json({ error: 'Invite already used' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invite already sent, expires soon' }, { status: 409 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const acceptUrl = `${process.env.NEXTAUTH_URL}/accept-staff-invite/${token}`;

    const invite = await prisma.staffInvite.create({
      data: {
        hackathonId: params.hackathonId,
        email,
        role: role as any,
        token,
        expiresAt,
      },
      include: { hackathon: { select: { title: true } } }
    });

    await sendMentorJudgeInvite(email, hackathon.title, role, acceptUrl, actor.name || 'Organiser');

    return NextResponse.json({
      message: `${role.toLowerCase()} invite sent`,
      data: invite
    });
  } catch (error) {
    console.error('Staff invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
