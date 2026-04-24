import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRoleSchema = z.object({
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
    const validatedData = updateRoleSchema.parse(body);

    // Only PARTICIPANT and ORGANISER can be self-selected.
    // JUDGE, MENTOR, and SPONSOR roles are assigned via staff invitations only.
    const selfSelectableRoles = ['PARTICIPANT', 'ORGANISER'];
    if (!selfSelectableRoles.includes(validatedData.role)) {
      return NextResponse.json(
        { error: 'This role can only be assigned via invitation' },
        { status: 403 }
      );
    }

    // Update user role
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { role: validatedData.role },
    });

    return NextResponse.json({
      message: 'Role updated successfully',
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
        { error: 'Validation failed', issues: error.errors },
        { status: 400 }
      );
    }

    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
