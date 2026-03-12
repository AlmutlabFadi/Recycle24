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
    const token = req.nextauth.token as (typeof req.nextauth.token & {
      permissions?: string[];
      status?: string;
    }) | null;

    const isAuth = !!token;
    const clientIp = getClientIp(req);

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

      const permissions = token?.permissions ?? [];
      if (!permissions.includes("MANAGE_ACCESS")) {
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
