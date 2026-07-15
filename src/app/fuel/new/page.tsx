import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { FuelEntryForm } from "@/components/fuel/fuel-entry-form";

export default async function AddFuelPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Add Fuel</h1>
          <p className="text-sm text-text-muted">Log a fill-up and BlackPearl calculates mileage automatically.</p>
        </div>
        <FuelEntryForm />
      </main>
    </>
  );
}
