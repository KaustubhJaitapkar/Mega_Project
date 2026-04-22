import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { User } from '@/types';
import { ApiResponse } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as User) || null;
}

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<User | null> {
  const user = await getCurrentUser();
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

export async function requireRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: string[]
): Promise<User | null> {
  const user = await requireAuth(req, res);
  if (!user || !allowedRoles.includes(user.role)) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return user;
}

export function successResponse<T>(
  res: NextApiResponse,
  data: T,
  statusCode = 200
): ApiResponse<T> {
  const response: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(response);
  return response;
}

export function errorResponse(
  res: NextApiResponse,
  message: string,
  statusCode = 400
): ApiResponse {
  const response: ApiResponse = { success: false, error: message };
  res.status(statusCode).json(response);
  return response;
}

export function validateRequest(
  req: NextApiRequest,
  methods: string[]
): boolean {
  return methods.includes(req.method || 'GET');
}

export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  };
}
