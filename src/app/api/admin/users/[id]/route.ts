import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Bike } from "@/models/Bike";
import { FuelEntry } from "@/models/FuelEntry";
import { Trip } from "@/models/Trip";
import { Maintenance } from "@/models/Maintenance";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bikes = await Bike.find({ userId: id }).lean();
  const [fuelEntries, trips, maintenanceRecords] = await Promise.all([
    FuelEntry.find({ userId: id }).lean(),
    Trip.countDocuments({ userId: id }),
    Maintenance.find({ userId: id }).lean(),
  ]);

  return NextResponse.json({
    user,
    bikes,
    summary: {
      fuelEntryCount: fuelEntries.length,
      totalFuelSpend: fuelEntries.reduce((s, e) => s + e.amount, 0),
      tripCount: trips,
      maintenanceCount: maintenanceRecords.length,
      totalMaintenanceSpend: maintenanceRecords.reduce((s, m) => s + m.amount, 0),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const user = await User.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  await connectDB();
  // Cascade-delete everything owned by this user.
  await Promise.all([
    Bike.deleteMany({ userId: id }),
    FuelEntry.deleteMany({ userId: id }),
    Trip.deleteMany({ userId: id }),
    Maintenance.deleteMany({ userId: id }),
  ]);
  const user = await User.findByIdAndDelete(id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
