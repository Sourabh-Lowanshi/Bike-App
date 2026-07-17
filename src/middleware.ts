import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Uses the SAME login-checking machinery (session/authorized callbacks) as
// the rest of the app via auth.config.ts — this used to be a hand-rolled
// getToken() check that could disagree with the real session on some hosts.
export const { auth: middleware } = NextAuth(authConfig);

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
