import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { DailyExpensesClient } from "@/components/expenses/daily-expenses-client";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-text-primary">Daily Expenses</h1>
          <p className="text-sm text-text-muted">
            Everyday spends — food, tea, cigarettes, and commute — separate from bike costs.
          </p>
        </div>
        <DailyExpensesClient />
      </main>
    </>
  );
}
