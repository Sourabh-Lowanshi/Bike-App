import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { Navbar } from "@/components/layout/navbar";
import { AdminUsersClient } from "@/components/admin/admin-users-client";

export default async function AdminUsersPage() {
  const { session, isAdmin } = await requireAdminSession();
  if (!session) redirect("/login");
  if (!isAdmin) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Users</h1>
          <p className="text-sm text-text-muted">Every account on BlackPearl.</p>
        </div>
        <AdminUsersClient />
      </main>
    </>
  );
}
