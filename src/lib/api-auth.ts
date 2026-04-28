/**
 * Centralized App Router auth helpers.
 * Use these at the top of every API route handler instead of
 * repeating getServerSession() + role checks inline.
 */
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { prisma } from './prisma';

export type UserRole = 'PARTICIPANT' | 'ORGANISER' | 'JUDGE' | 'MENTOR' | 'SPONSOR';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

/** Returns the current session user or null. */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const u = session.user as { id: string; email: string; name?: string | null; role?: string };
  if (!u.id || !u.email) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: (u.role as UserRole) || 'PARTICIPANT',
  };
}

/** Require an authenticated user. Returns the user or a 401 NextResponse. */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return user;
}

/** Require a specific role. Returns the user or a 401/403 NextResponse. */
export async function requireRole(
  allowedRoles: UserRole | UserRole[]
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

/**
 * Require the current user to be the organiser of the given hackathon.
 * Returns the user or a 401/403/404 NextResponse.
 */
export async function requireOrganizerOf(
  hackathonId: string
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'ORGANISER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const hackathon = await prisma.hackathon.findUnique({
    where: { id: hackathonId },
    select: { organiserId: true },
  });
  if (!hackathon) {
    return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
  }
  if (hackathon.organiserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

/**
 * Require the current user to own the resource (by comparing a userId field).
 * Returns the user or a 401/403 NextResponse.
 */
export async function requireOwnership(
  resourceUserId: string
): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.id !== resourceUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

/** Type guard: returns true if the value is a NextResponse (i.e., an error). */
export function isErrorResponse(val: unknown): val is NextResponse {
  return val instanceof NextResponse;
}
