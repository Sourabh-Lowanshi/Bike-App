import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { MaintenanceClient } from "@/components/maintenance/maintenance-client";

export default async function MaintenancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Maintenance</h1>
          <p className="text-sm text-text-muted">Every service, part, and expense — in one place.</p>
        </div>
        <MaintenanceClient />
      </main>
    </>
  );
}
