import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const authOnlyPrefixes = [
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

const adminPrefixes = ["/admin"];
const publicOnlyPrefixes = ["/login", "/register"];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function getClientIp(req: NextRequest) {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

export default withAuth(
  async function proxy(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;
    const isAuth = !!token;
    const clientIp = getClientIp(req);

    // Placeholder only — not a persistent distributed blocklist
    const blockedIPs = new Set<string>();

    if (clientIp !== "unknown" && blockedIPs.has(clientIp)) {
      return NextResponse.redirect(new URL("/login?error=ip_blocked", req.url));
    }

    if (isAuth && token?.status === "BANNED") {
      return NextResponse.redirect(new URL("/login?error=account_suspended", req.url));
    }

    if (startsWithAny(pathname, publicOnlyPrefixes)) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    if (startsWithAny(pathname, adminPrefixes)) {
      if (!isAuth) {
        return NextResponse.redirect(
          new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url)
        );
      }

      const role = String(token?.role || "");
      const userType = String(token?.userType || "");
      const isAdmin =
        role === "ADMIN" ||
        role === "SUPER_ADMIN" ||
        userType === "ADMIN";

      if (!isAdmin) {
        return NextResponse.redirect(new URL("/", req.url));
      }

      return NextResponse.next();
    }

    if (startsWithAny(pathname, authOnlyPrefixes) && !isAuth) {
      let from = pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/login?redirect=${encodeURIComponent(from)}`, req.url)
      );
    }

    return NextResponse.next();
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
