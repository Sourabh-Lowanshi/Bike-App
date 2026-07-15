import { auth } from "@/auth";

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user) return { session: null, isAdmin: false as const };
  const role = (session.user as { role?: string }).role;
  return { session, isAdmin: role === "admin" };
}
