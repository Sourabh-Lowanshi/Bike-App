import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { ComplianceClient } from "@/components/compliance/compliance-client";

export default async function CompliancePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Compliance</h1>
          <p className="text-sm text-text-muted">Challan and insurance status for your active bike.</p>
        </div>
        <ComplianceClient />
      </main>
    </>
  );
}
