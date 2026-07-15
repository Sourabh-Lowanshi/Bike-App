import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Bike } from "@/models/Bike";
import { FuelEntry } from "@/models/FuelEntry";

export async function GET() {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).lean();

  const enriched = await Promise.all(
    users.map(async (u) => {
      const [bikeCount, fuelEntries] = await Promise.all([
        Bike.countDocuments({ userId: u._id }),
        FuelEntry.find({ userId: u._id }).lean(),
      ]);
      return {
        ...u,
        bikeCount,
        totalFuelSpend: fuelEntries.reduce((sum, e) => sum + e.amount, 0),
      };
    })
  );

  return NextResponse.json({ users: enriched });
}
