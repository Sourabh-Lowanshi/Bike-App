import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { Navbar } from "@/components/layout/navbar";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminPage() {
  const { session, isAdmin } = await requireAdminSession();
  if (!session) redirect("/login");
  if (!isAdmin) redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Admin</h1>
          <p className="text-sm text-text-muted">Platform-wide overview across every rider.</p>
        </div>
        <AdminDashboardClient />
      </main>
    </>
  );
}
