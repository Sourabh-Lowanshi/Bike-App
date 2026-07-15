import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { TripTracker } from "@/components/trips/trip-tracker";

export default async function TripsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Trips</h1>
          <p className="text-sm text-text-muted">Track rides live with your device&apos;s GPS.</p>
        </div>
        <TripTracker />
      </main>
    </>
  );
}
