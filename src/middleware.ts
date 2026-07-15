import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Edge-safe route protection. This intentionally does NOT import `auth.ts`
// (which pulls in Mongoose/Node APIs) — the Edge middleware runtime can't
// run those. `getToken` just decodes the JWT session cookie (role is
// embedded in the token by the jwt() callback in auth.ts).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/fuel",
  "/trips",
  "/maintenance",
  "/expenses",
  "/garage",
  "/compliance",
  "/settings",
  "/analytics",
  "/reports",
  "/admin",
];
const ADMIN_PREFIXES = ["/admin"];

export async function middleware(request: Request) {
  const url = new URL(request.url);
  const isProtected = PROTECTED_PREFIXES.some((p) => url.pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req: request as unknown as import("next/server").NextRequest,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", url.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAdminRoute = ADMIN_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/fuel/:path*",
    "/trips/:path*",
    "/maintenance/:path*",
    "/expenses/:path*",
    "/garage/:path*",
    "/compliance/:path*",
    "/settings/:path*",
    "/analytics/:path*",
    "/reports/:path*",
    "/admin/:path*",
  ],
};
