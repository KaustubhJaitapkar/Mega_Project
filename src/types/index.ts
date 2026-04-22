import { User as NextAuthUser } from 'next-auth';

export interface User extends NextAuthUser {
  id: string;
  role: 'PARTICIPANT' | 'ORGANISER' | 'JUDGE' | 'MENTOR' | 'SPONSOR';
  emailVerified: Date | null;
}

export interface Session {
  user: User;
  expires: string;
}

export type HackathonStatus = 'DRAFT' | 'REGISTRATION' | 'ONGOING' | 'ENDED' | 'CANCELLED';
export type TeamStatus = 'FORMING' | 'COMPLETE' | 'DISBANDED';
export type JoinRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type SubmissionStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type CertificateType = 'PARTICIPANT' | 'WINNER' | 'RUNNER_UP' | 'BEST_PROJECT';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
