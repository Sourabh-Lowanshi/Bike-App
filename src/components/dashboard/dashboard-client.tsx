"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Fuel,
  CalendarClock,
  CalendarRange,
  Gauge,
  MapPin,
  Droplet,
  Wrench,
  Wallet,
  BatteryMedium,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  FuelExpenseChart,
  MileageTrendChart,
  ExpensePieChart,
  FuelVsMaintenanceBar,
} from "@/components/dashboard/charts";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DashboardStats, AnalyticsData, IBike } from "@/types";
import { useBikes } from "@/hooks/use-bikes";

interface AnalyticsResponse {
  dashboard: DashboardStats;
  analytics: AnalyticsData;
  charts: {
    fuelExpenseByMonth: { month: string; amount: number }[];
    expenseByCategory: { category: string; amount: number }[];
    yearlyFuelTotal: number;
  };
  bike: IBike | null;
}

async function fetchAnalytics(bikeId: string | null): Promise<AnalyticsResponse> {
  const res = await fetch(bikeId ? `/api/analytics?bikeId=${bikeId}` : "/api/analytics");
  if (!res.ok) throw new Error("Failed to load analytics");
  return res.json();
}

export function DashboardClient() {
  const { activeBikeId } = useBikes();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", activeBikeId],
    queryFn: () => fetchAnalytics(activeBikeId),
    enabled: !!activeBikeId,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const { dashboard: stats, analytics, charts } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard title="Total Fuel Cost" value={formatCurrency(stats.totalFuelCost)} icon={Fuel} accent="pearl" />
        <StatCard title="Today's Fuel" value={formatCurrency(stats.todaysFuel)} icon={CalendarClock} />
        <StatCard title="Monthly Fuel" value={formatCurrency(stats.monthlyFuel)} icon={CalendarRange} />
        <StatCard title="Average Mileage" value={`${stats.averageMileage} km/l`} icon={Gauge} accent="success" />
        <StatCard title="Distance This Month" value={`${stats.distanceThisMonth.toFixed(0)} km`} icon={MapPin} />
        <StatCard
          title="Last Refuel"
          value={stats.lastRefuel ? formatCurrency(stats.lastRefuel.amount) : "—"}
          hint={stats.lastRefuel ? `${formatDate(stats.lastRefuel.date)} · ${stats.lastRefuel.liters} L` : "No entries yet"}
          icon={Droplet}
        />
        <StatCard
          title="Fuel Remaining (est.)"
          value={`${stats.fuelRemaining.toFixed(1)} L`}
          icon={BatteryMedium}
          accent={stats.fuelRemaining < 2 ? "danger" : undefined}
        />
        <StatCard title="Maintenance Cost" value={formatCurrency(stats.maintenanceCost)} icon={Wrench} />
        <StatCard title="Lifetime Expense" value={formatCurrency(stats.lifetimeExpense)} icon={Wallet} accent="pearl" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Best Mileage" value={`${analytics.bestMileage} km/l`} icon={Gauge} accent="success" />
        <StatCard title="Worst Mileage" value={`${analytics.worstMileage} km/l`} icon={Gauge} />
        <StatCard title="Cost / km" value={`₹${analytics.fuelCostPerKm}`} icon={Wallet} />
        <StatCard title="Efficiency Score" value={`${analytics.fuelEfficiencyScore}/100`} icon={Gauge} accent="pearl" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FuelExpenseChart data={charts.fuelExpenseByMonth} />
        <MileageTrendChart data={analytics.monthlyAverageMileage} />
        <ExpensePieChart data={charts.expenseByCategory} />
        <FuelVsMaintenanceBar fuel={stats.totalFuelCost} maintenance={stats.maintenanceCost} />
      </div>
    </div>
  );
}
