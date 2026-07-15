import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { FuelEntry } from "@/models/FuelEntry";
import { Maintenance } from "@/models/Maintenance";
import { Bike } from "@/models/Bike";
import { estimateFuelRemaining, costPerKm } from "@/lib/mileage";
import { startOfMonth, startOfDay, startOfYear, format, differenceInCalendarDays } from "date-fns";

// Single endpoint that powers both the dashboard cards and the analytics
// page, so the math lives in exactly one place.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const requestedBikeId = searchParams.get("bikeId");

  await connectDB();

  const bike = requestedBikeId
    ? await Bike.findOne({ _id: requestedBikeId, userId }).lean()
    : await Bike.findOne({ userId }).sort({ isDefault: -1 }).lean();

  const bikeFilter: Record<string, unknown> = { userId };
  if (bike) bikeFilter.bikeId = bike._id;

  const fuelEntries = await FuelEntry.find(bikeFilter)
    .sort({ odometerReading: 1 })
    .lean();
  const maintenance = await Maintenance.find(bikeFilter).lean();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const dayStart = startOfDay(now);
  const yearStart = startOfYear(now);

  const totalFuelCost = fuelEntries.reduce((sum, e) => sum + e.amount, 0);
  const todaysFuel = fuelEntries
    .filter((e) => new Date(e.date) >= dayStart)
    .reduce((sum, e) => sum + e.amount, 0);
  const monthlyFuelEntries = fuelEntries.filter((e) => new Date(e.date) >= monthStart);
  const monthlyFuel = monthlyFuelEntries.reduce((sum, e) => sum + e.amount, 0);
  const yearlyFuelEntries = fuelEntries.filter((e) => new Date(e.date) >= yearStart);

  const mileageValues = fuelEntries
    .map((e) => e.mileage)
    .filter((m): m is number => typeof m === "number" && m > 0);

  const averageMileage =
    mileageValues.length > 0
      ? Number((mileageValues.reduce((a, b) => a + b, 0) / mileageValues.length).toFixed(2))
      : 0;
  const bestMileage = mileageValues.length ? Math.max(...mileageValues) : 0;
  const worstMileage = mileageValues.length ? Math.min(...mileageValues) : 0;

  const distanceThisMonth = monthlyFuelEntries.reduce(
    (sum, e) => sum + (e.distanceSinceLast ?? 0),
    0
  );
  const totalDistance = fuelEntries.reduce(
    (sum, e) => sum + (e.distanceSinceLast ?? 0),
    0
  );

  const lastEntry = fuelEntries[fuelEntries.length - 1] ?? null;
  const lastRefuel = lastEntry
    ? { date: lastEntry.date, liters: lastEntry.liters, amount: lastEntry.amount }
    : null;

  const fuelRemaining =
    bike && lastEntry
      ? estimateFuelRemaining({
          tankCapacity: bike.tankCapacity,
          lastFillLiters: lastEntry.liters,
          lastFillOdometer: lastEntry.odometerReading,
          currentOdometer: bike.currentOdometer,
          averageMileage: averageMileage || 35,
        })
      : bike?.tankCapacity ?? 0;

  const maintenanceCost = maintenance.reduce((sum, m) => sum + m.amount, 0);
  const lifetimeExpense = totalFuelCost + maintenanceCost;

  // Monthly mileage trend (last 6 buckets, in chronological order)
  const monthlyBuckets = new Map<string, number[]>();
  for (const e of fuelEntries) {
    if (!e.mileage) continue;
    const key = format(new Date(e.date), "MMM yy");
    const arr = monthlyBuckets.get(key) ?? [];
    arr.push(e.mileage);
    monthlyBuckets.set(key, arr);
  }
  const monthlyAverageMileage = Array.from(monthlyBuckets.entries())
    .slice(-6)
    .map(([month, values]) => ({
      month,
      mileage: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
    }));

  const fuelExpenseByMonth = (() => {
    const buckets = new Map<string, number>();
    for (const e of fuelEntries) {
      const key = format(new Date(e.date), "MMM yy");
      buckets.set(key, (buckets.get(key) ?? 0) + e.amount);
    }
    return Array.from(buckets.entries())
      .slice(-6)
      .map(([month, amount]) => ({ month, amount }));
  })();

  const expenseByCategory = (() => {
    const buckets = new Map<string, number>();
    buckets.set("Fuel", totalFuelCost);
    for (const m of maintenance) {
      buckets.set(m.category, (buckets.get(m.category) ?? 0) + m.amount);
    }
    return Array.from(buckets.entries()).map(([category, amount]) => ({ category, amount }));
  })();

  const firstEntryDate = fuelEntries[0]?.date ?? maintenance[0]?.date ?? now;
  const daysSinceStart = Math.max(1, differenceInCalendarDays(now, new Date(firstEntryDate)));
  const monthsSinceStart = Math.max(1, daysSinceStart / 30);
  const yearsSinceStart = Math.max(1, daysSinceStart / 365);

  const fuelCostPerKm = costPerKm(totalFuelCost, totalDistance);
  const costPerDay = Number((lifetimeExpense / daysSinceStart).toFixed(2));
  const costPerMonth = Number((lifetimeExpense / monthsSinceStart).toFixed(2));
  const costPerYear = Number((lifetimeExpense / yearsSinceStart).toFixed(2));

  // A simple composite "efficiency score" 0-100: rewards mileage above a
  // 35 km/l baseline and penalizes high cost-per-km, clipped to range.
  const mileageScore = Math.min(60, (averageMileage / 45) * 60);
  const costScore = Math.min(40, Math.max(0, 40 - fuelCostPerKm * 8));
  const fuelEfficiencyScore = Math.round(mileageScore + costScore);

  return NextResponse.json({
    dashboard: {
      totalFuelCost,
      todaysFuel,
      monthlyFuel,
      averageMileage,
      distanceThisMonth,
      lastRefuel,
      fuelRemaining,
      maintenanceCost,
      lifetimeExpense,
    },
    analytics: {
      averageMileage,
      bestMileage,
      worstMileage,
      monthlyAverageMileage,
      fuelCostPerKm,
      costPerDay,
      costPerMonth,
      costPerYear,
      fuelEfficiencyScore,
      totalDistance,
      estimatedFuelRemaining: fuelRemaining,
    },
    charts: {
      fuelExpenseByMonth,
      expenseByCategory,
      yearlyFuelTotal: yearlyFuelEntries.reduce((s, e) => s + e.amount, 0),
    },
    bike,
  });
}
