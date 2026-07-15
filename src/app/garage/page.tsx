import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { GarageClient } from "@/components/garage/garage-client";

export default async function GaragePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Garage</h1>
          <p className="text-sm text-text-muted">Manage every bike you track — the highlighted one is active everywhere else in the app.</p>
        </div>
        <GarageClient />
      </main>
    </>
  );
}
