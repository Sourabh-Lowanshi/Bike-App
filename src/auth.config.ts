import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

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

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login" },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days — explicit so nobody has to guess why sessions last this long
    updateAge: 24 * 60 * 60, // refresh the cookie's expiry once a day of activity
  },
  // No providers here — Google/Credentials (and their DB calls) only live in
  // the full config in auth.ts. This file must stay Edge-runtime-safe.
  providers: [],
  callbacks: {
    // Shapes `session.user` from the JWT. Kept identical to the full config's
    // session callback so both instances (edge + node) agree on what a
    // logged-in user looks like.
    session({ session, token }) {
      if (session.user && token?.userId) {
        (session.user as typeof session.user & { id: string; role?: string }).id =
          token.userId as string;
        (session.user as typeof session.user & { id: string; role?: string }).role =
          (token.role as string | undefined) ?? "user";
      }
      return session;
    },
    // This is what the middleware actually calls on every request.
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
      if (!isProtected) return true;

      if (!auth?.user) return false; // NextAuth auto-redirects to `pages.signIn`, preserving callbackUrl.

      const isAdminRoute = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
      if (isAdminRoute && (auth.user as { role?: string }).role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      return true;
    },
  },
};

export default authConfig;
