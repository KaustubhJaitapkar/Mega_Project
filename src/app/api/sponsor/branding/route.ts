import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const sponsor = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!sponsor || sponsor.role !== 'SPONSOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { logoUrl, tier } = await req.json();
    const updated = await prisma.user.update({
      where: { id: sponsor.id },
      data: {
        image: logoUrl || sponsor.image,
        profile: {
          upsert: {
            create: { company: tier || 'title' },
            update: { company: tier || 'title' },
          },
        },
      },
      include: { profile: true },
    });
    return NextResponse.json({
      message: 'Branding updated',
      data: {
        logoUrl: updated.image,
        tier: updated.profile?.company,
      },
    });
  } catch (error) {
    console.error('Sponsor branding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

