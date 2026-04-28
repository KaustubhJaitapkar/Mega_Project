import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMentorJudgeInvite } from '@/lib/email';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Generate a secure random password
function generateTemporaryPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  const values = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length];
  }
  return password;
}

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

    const { email, role, createAccount = true } = await req.json();
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

    // Check if user already exists
    let existingUser = await prisma.user.findUnique({ where: { email } });
    let temporaryPassword: string | null = null;
    let credentials: { email: string; temporaryPassword: string } | undefined;

    if (!existingUser && createAccount) {
      // Create new user account with auto-generated credentials
      temporaryPassword = generateTemporaryPassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      const nameFromEmail = email.split('@')[0].replace(/[._-]/g, ' ');
      const capitalizedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

      existingUser = await prisma.user.create({
        data: {
          email,
          name: capitalizedName,
          password: hashedPassword,
          role: role as any,
          emailVerified: new Date(), // Auto-verify staff accounts
        },
      });

      credentials = { email, temporaryPassword };
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

    // Add user to hackathon's judges/mentors if user exists
    if (existingUser) {
      if (role === 'JUDGE') {
        await prisma.hackathon.update({
          where: { id: params.hackathonId },
          data: { judges: { connect: { id: existingUser.id } } },
        });
      } else {
        await prisma.hackathon.update({
          where: { id: params.hackathonId },
          data: { mentors: { connect: { id: existingUser.id } } },
        });
      }
    }

    // Send invite email with credentials if account was created
    await sendMentorJudgeInvite(
      email,
      hackathon.title,
      role,
      acceptUrl,
      actor.name || 'Organiser',
      credentials
    );

    return NextResponse.json({
      message: `${role.toLowerCase()} invite sent${credentials ? ' with account credentials' : ''}`,
      data: {
        invite,
        accountCreated: !!credentials,
        // Don't return password in response for security
        ...(credentials && { temporaryPasswordSent: true }),
      }
    });
  } catch (error) {
    console.error('Staff invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
