import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Role-based route guards
    const roleRouteMap: Record<string, string> = {
      '/organiser': 'ORGANISER',
      '/judge': 'JUDGE',
      '/mentor': 'MENTOR',
      '/sponsor': 'SPONSOR',
      '/participant': 'PARTICIPANT',
    };

    for (const [prefix, requiredRole] of Object.entries(roleRouteMap)) {
      if (pathname.startsWith(prefix)) {
        if (token?.role !== requiredRole) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/organiser/:path*',
    '/participant/:path*',
    '/judge/:path*',
    '/mentor/:path*',
    '/sponsor/:path*',
    '/profile/:path*',
    '/select-role',
    '/create',
    '/api/((?!auth).)*',
  ],
};
