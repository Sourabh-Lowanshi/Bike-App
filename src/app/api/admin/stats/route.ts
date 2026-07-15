import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Bike } from "@/models/Bike";
import { FuelEntry } from "@/models/FuelEntry";
import { Trip } from "@/models/Trip";
import { Maintenance } from "@/models/Maintenance";

export async function GET() {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const [userCount, bikeCount, fuelEntries, trips, maintenanceRecords] = await Promise.all([
    User.countDocuments(),
    Bike.countDocuments(),
    FuelEntry.find().lean(),
    Trip.countDocuments(),
    Maintenance.find().lean(),
  ]);

  const totalFuelSpend = fuelEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalMaintenanceSpend = maintenanceRecords.reduce((sum, m) => sum + m.amount, 0);

  return NextResponse.json({
    stats: {
      userCount,
      bikeCount,
      fuelEntryCount: fuelEntries.length,
      tripCount: trips,
      maintenanceCount: maintenanceRecords.length,
      totalFuelSpend,
      totalMaintenanceSpend,
      totalPlatformSpend: totalFuelSpend + totalMaintenanceSpend,
    },
  });
}
