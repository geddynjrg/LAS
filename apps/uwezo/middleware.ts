import { NextResponse, userAgent, type NextRequest } from "next/server";

import { updateSession } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/apply", "/admin"];
const publicRoutes = ["/login", "/signup", "/reset"];

const loggedInRedirect = "/dashboard";
const loggedOutRedirect = "/login";

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  const { device } = userAgent(request);
  const deviceType = device.type === "mobile" ? "mobile" : "desktop";

  // Add new request headers
  requestHeaders.set("x-path", request.nextUrl.pathname);
  requestHeaders.set("x-device-type", deviceType);

  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
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
    newUrl.searchParams.set("callbackUrl", callbackUrl);

    return NextResponse.redirect(newUrl, {
      headers: requestHeaders,
    });
  }

  // Redirect api requests to api route with correct headers
  // Exclude internal Next.js API routes
  const internalApiRoutes = [
    "/api/profile", 
    "/api/logout", 
    "/api/upload",
    "/api/admin/sync-queue",
    "/api/cron/sync-applications",
    "/api/test"
  ];
  const isInternalRoute = internalApiRoutes.some((route) =>
    path.startsWith(route),
  );

  if (path.startsWith("/api") && !isInternalRoute) {
    const newUrl = new URL(
      `${path}${request.nextUrl.search}`,
      process.env.NEXT_API_URL,
    );

    if (session) {
      requestHeaders.set("authorization", `Bearer ${session}`);
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
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
