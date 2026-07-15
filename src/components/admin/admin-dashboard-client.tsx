"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, Bike as BikeIcon, Fuel, Route, Wrench, Wallet, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface AdminStats {
  userCount: number;
  bikeCount: number;
  fuelEntryCount: number;
  tripCount: number;
  maintenanceCount: number;
  totalFuelSpend: number;
  totalMaintenanceSpend: number;
  totalPlatformSpend: number;
}

async function fetchStats(): Promise<{ stats: AdminStats }> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to load admin stats");
  return res.json();
}

export function AdminDashboardClient() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchStats });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass h-28 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard title="Total Users" value={String(stats.userCount)} icon={Users} accent="pearl" />
        <StatCard title="Total Bikes" value={String(stats.bikeCount)} icon={BikeIcon} />
        <StatCard title="Fuel Entries" value={String(stats.fuelEntryCount)} icon={Fuel} />
        <StatCard title="Trips Logged" value={String(stats.tripCount)} icon={Route} />
        <StatCard title="Maintenance Records" value={String(stats.maintenanceCount)} icon={Wrench} />
        <StatCard
          title="Platform-wide Spend"
          value={formatCurrency(stats.totalPlatformSpend)}
          icon={Wallet}
          accent="pearl"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-text-muted">
          View every account, edit profiles and roles, manage their bikes, or remove accounts entirely.
        </p>
        <Link href="/admin/users">
          <Button variant="glass">
            Go to Users <ArrowRight size={14} />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
