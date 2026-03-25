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

const ADMIN_PERMISSIONS = new Set<string>([
  "MANAGE_USERS",
  "MANAGE_FINANCE",
  "FINANCE_FINAL_APPROVE",
  "MANAGE_DRIVERS",
  "REVIEW_DRIVER_DOCS",
  "MANAGE_SUPPORT",
  "MANAGE_REWARDS",
  "MANAGE_KNOWLEDGE",
  "UPLOAD_MEDIA",
  "MANAGE_ACCESS",
  "ACCESS_SAFETY",
  "ACCESS_CONSULTATIONS",
  "ACCESS_ACADEMY",
]);

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

function hasAnyAdminPermission(permissions: string[]) {
  return permissions.some((permission) => ADMIN_PERMISSIONS.has(permission));
}
export default withAuth(
  async function proxy(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token as (typeof req.nextauth.token & {
      permissions?: string[];
      status?: string;
      userType?: string;
    }) | null;

    const isAuth = !!token;
    const clientIp = getClientIp(req);

    const blockedIPs = new Set<string>();

    if (clientIp !== "unknown" && blockedIPs.has(clientIp)) {
      return NextResponse.redirect(new URL("/login?error=ip_blocked", req.url));
    }

    if (isAuth && token?.status === "BANNED") {
      return NextResponse.redirect(
        new URL("/login?error=account_suspended", req.url)
      );
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
      const hasAdminAccess =
        hasAnyAdminPermission(permissions) || token?.userType === "ADMIN";

      if (!hasAdminAccess) {
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
