import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const setRoleSchema = z.object({
  role: z.enum(['PARTICIPANT', 'ORGANISER', 'JUDGE', 'MENTOR', 'SPONSOR']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { role } = setRoleSchema.parse(body);

    // Update user role
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { role },
    });

    return NextResponse.json({
      message: 'Role set successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    console.error('Set role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
