// middleware.ts
import { updateSession } from '@/lib/session';
import { type NextRequest, NextResponse, userAgent } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/apply', '/admin'] as const;
const ADMIN_ROUTES = ['/admin'] as const;
const PUBLIC_ROUTES = ['/login', '/signup', '/reset'] as const;

const LOGGED_IN_REDIRECT = '/dashboard';
const LOGGED_OUT_REDIRECT = '/login';

const INTERNAL_API_ROUTES = [
  '/api/auth',
  '/api/profile',
  '/api/logout',
  '/api/upload',
  '/api/admin',
  '/api/test',
] as const;

async function isAdmin(sessionToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/user/profile`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) return false;
    const { data } = await res.json();
    const roles = (data?.roles ?? []) as string[];
    return roles.some((r) =>
      ['admin', 'administrator'].includes(r.toLowerCase()),
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { device } = userAgent(request);
  const deviceType = device.type === 'mobile' ? 'mobile' : 'desktop';

  const headers = new Headers(request.headers);
  headers.set('x-path', pathname);
  headers.set('x-device-type', deviceType);

  const session = await updateSession();

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isInternalApi = INTERNAL_API_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect logged-in users away from public pages
  if (isPublic && session) {
    return NextResponse.redirect(new URL(LOGGED_IN_REDIRECT, request.url));
  }

  // Redirect logged-out users from protected routes
  if (isProtected && !session) {
    const loginUrl = new URL(LOGGED_OUT_REDIRECT, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (isAdminRoute && session) {
    const hasAdminAccess = await isAdmin(session);
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL(LOGGED_IN_REDIRECT, request.url));
    }
  }

  // Proxy external API calls
  if (pathname.startsWith('/api') && !isInternalApi) {
    const apiUrl = new URL(`${pathname}${search}`, process.env.API_URL);
    if (session) {
      headers.set('authorization', `Bearer ${session}`);
    }
    return NextResponse.rewrite(apiUrl, { headers });
  }

  // Continue with modified headers
  return NextResponse.next({
    request: { headers },
  });
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
