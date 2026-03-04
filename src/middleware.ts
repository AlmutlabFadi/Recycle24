import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/wallet",
  "/deals",
  "/auctions/create",
  "/profile",
  "/dashboard",
  "/sell",
  "/rewards",
  "/notifications",
  "/settings",
  "/verification",
  "/contracts",
  "/transport/book",
  "/transport/driver",
  "/support/tickets",
];

const blockedIPs = new Set<string>([]);

export default withAuth(
  async function middleware(req) {
      const xForwardedFor = req.headers.get('x-forwarded-for');
      const clientIp = xForwardedFor ? xForwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
      
      if (clientIp !== 'unknown' && blockedIPs.has(clientIp)) {
          console.warn(`[GSOCC SHIELD] Blocked request from isolated IP: ${clientIp}`);
          return new NextResponse(
              JSON.stringify({ error: 'Access Denied by GSOCC Sovereign Control.' }),
              { status: 403, headers: { 'content-type': 'application/json' } }
          );
      }

    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAdmin = token?.role === "ADMIN" || token?.userType === "ADMIN";
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

    // Redirect authenticated users away from login/register
    if (isAuthPage) {
      if (isAuth) {
        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin/soc", req.url));
        }
        return NextResponse.redirect(new URL("/", req.url));
      }
      return null;
    }

    // Protect /admin routes — only ADMIN role allowed
    if (isAdminRoute) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // Redirect admin users away from client pages
    if (!isAdminRoute && isAuth && isAdmin && (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/profile"))) {
      return NextResponse.redirect(new URL("/admin/soc", req.url));
    }

    const isProtectedRoute = protectedRoutes.some(
      (route) => req.nextUrl.pathname === route || req.nextUrl.pathname.startsWith(`${route}/`)
    );

    if (isProtectedRoute && !isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }
      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(from)}`, req.url)
      );
    }

  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
