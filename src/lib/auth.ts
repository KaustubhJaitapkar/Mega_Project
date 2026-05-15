import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from './email';

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  useSecureCookies,
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
      allowDangerousEmailAccountLinking: false,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: false,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: sendVerificationEmail,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            password: true,
            isBanned: true,
          },
        });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        if (user.isBanned) {
          throw new Error('Account has been suspended');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string | null })?.role || 'PARTICIPANT';
      }

      // Persist role changes made via `useSession().update(...)`
      if (trigger === 'update' && session?.role) {
        token.role = session.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = (token.role as string) || 'PARTICIPANT';
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Never redirect to auth pages after login, except role selection pages
      if (url.startsWith('/login') || url.startsWith('/signup')) {
        return `${baseUrl}/dashboard`;
      }
      // Allow role selection pages for new users
      if (url.startsWith('/select-role') || url.startsWith('/role-selection')) {
        return `${baseUrl}${url}`;
      }
      // Allow relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async signIn({ user, account }) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isBanned: true, createdAt: true, updatedAt: true },
        });

        if (dbUser?.isBanned) {
          return false;
        }

        if (account && account.provider !== 'credentials' && dbUser) {
          const diff = Math.abs(
            dbUser.updatedAt.getTime() - dbUser.createdAt.getTime()
          );
          if (diff < 30000) {
            return '/role-selection';
          }
        }

        return true;
      } catch (error) {
        console.error('[auth] signIn callback failed:', error);
        return false;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/role-selection',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) return;
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        });
      } catch (error) {
        console.error('[auth] signIn event failed:', error);
      }
    },
  },
};
