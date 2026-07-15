import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin";
import { Navbar } from "@/components/layout/navbar";
import { AdminUserDetailClient } from "@/components/admin/admin-user-detail-client";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { session, isAdmin } = await requireAdminSession();
  if (!session) redirect("/login");
  if (!isAdmin) redirect("/dashboard");
  const { id } = await params;

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Rider Detail</h1>
          <p className="text-sm text-text-muted">Full read/write access to this rider&apos;s profile and bikes.</p>
        </div>
        <AdminUserDetailClient userId={id} />
      </main>
    </>
  );
}
