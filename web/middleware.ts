import { updateSession } from '@/lib/session';
import { type NextRequest, NextResponse, userAgent } from 'next/server';

const protectedRoutes = ['/dashboard', '/apply', '/admin'];
const adminRoutes = ['/admin'];
const publicRoutes = ['/login', '/signup', '/reset', '/payment-success'];

const loggedInRedirect = '/dashboard';
const loggedOutRedirect = '/login';

// Helper function to check if user has admin role
async function isUserAdmin(session: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.API_URL}/api/v1/user/profile`, {
      headers: {
        Authorization: `Bearer ${session}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const roles = data.data?.roles || [];

    return roles.some(
      (role: string) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() === 'administrator',
    );
  } catch (error) {
    console.error('Error checking admin role in middleware:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  const { device } = userAgent(request);
  const deviceType = device.type === 'mobile' ? 'mobile' : 'desktop';

  // Add new request headers
  requestHeaders.set('x-path', request.nextUrl.pathname);
  requestHeaders.set('x-device-type', deviceType);

  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => path.startsWith(r));
  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r));
  const session = await updateSession();

  // redirect logged in user to dashboard if they try to access public route
  if (isPublicRoute && session && !path.startsWith(loggedInRedirect)) {
    return NextResponse.redirect(new URL(loggedInRedirect, request.nextUrl), {
      headers: requestHeaders,
    });
  }

  // redirect logged out user to login page if they try to access protected route
  if (isProtectedRoute && !session && !path.startsWith(loggedOutRedirect)) {
    const newUrl = new URL(loggedOutRedirect, request.nextUrl);
    // Include the full path with search params
    const callbackUrl = request.nextUrl.pathname + request.nextUrl.search;
    newUrl.searchParams.set('callbackUrl', callbackUrl);

    return NextResponse.redirect(newUrl, {
      headers: requestHeaders,
    });
  }

  // Admin route protection - check roles at middleware level for fastest redirect
  if (isAdminRoute && session) {
    const isAdmin = await isUserAdmin(session);

    if (!isAdmin) {
      return NextResponse.redirect(new URL(loggedInRedirect, request.nextUrl), {
        headers: requestHeaders,
      });
    }
  }

  // Redirect api requests to api route with correct headers
  // Exclude internal Next.js API routes
  const internalApiRoutes = [
    '/api/health',
    '/api/profile',
    '/api/logout',
    '/api/upload',
    '/api/admin/sync-queue',
    '/api/cron/sync-applications',
    '/api/cron/sync-status-from-drupal',
    '/api/geocode',
    '/api/payments',
    '/api/applications',
    '/api/test',
  ];
  const isInternalRoute = internalApiRoutes.some((route) =>
    path.startsWith(route),
  );

  if (path.startsWith('/api') && !isInternalRoute) {
    const newUrl = new URL(
      `${path}${request.nextUrl.search}`,
      process.env.API_URL,
    );

    if (session) {
      requestHeaders.set('authorization', `Bearer ${session}`);
    }

    return NextResponse.rewrite(newUrl, { headers: requestHeaders });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// the following code has been copied from https://nextjs.org/docs/advanced-features/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
