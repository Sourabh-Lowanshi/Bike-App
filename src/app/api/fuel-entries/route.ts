import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { FuelEntry } from "@/models/FuelEntry";
import { Bike } from "@/models/Bike";
import { fuelEntrySchema } from "@/lib/validations";
import { calculateMileage } from "@/lib/mileage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const bikeId = searchParams.get("bikeId");

  const filter: Record<string, unknown> = { userId: (session.user as { id: string }).id };
  if (bikeId) filter.bikeId = bikeId;

  const entries = await FuelEntry.find(filter)
    .sort({ odometerReading: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const parsed = fuelEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  await connectDB();

  const bike = await Bike.findOne({ _id: data.bikeId, userId });
  if (!bike) return NextResponse.json({ error: "Bike not found" }, { status: 404 });

  // Find the previous fuel entry (by odometer reading) to compute distance/mileage.
  const previousEntry = await FuelEntry.findOne({
    userId,
    bikeId: bike._id,
    odometerReading: { $lt: data.odometerReading },
  })
    .sort({ odometerReading: -1 })
    .lean();

  const { distanceSinceLastFill, mileage } = calculateMileage(
    data.odometerReading,
    data.liters,
    previousEntry ? previousEntry.odometerReading : null
  );

  const pricePerLiter = Number((data.amount / data.liters).toFixed(2));

  const entry = await FuelEntry.create({
    userId,
    bikeId: bike._id,
    date: data.date,
    liters: data.liters,
    amount: data.amount,
    pricePerLiter,
    odometerReading: data.odometerReading,
    latitude: data.latitude,
    longitude: data.longitude,
    fuelStationName: data.fuelStationName || undefined,
    notes: data.notes || undefined,
    distanceSinceLast: distanceSinceLastFill,
    mileage: mileage ?? undefined,
  });

  // Keep the bike's odometer current.
  if (data.odometerReading > bike.currentOdometer) {
    bike.currentOdometer = data.odometerReading;
    await bike.save();
  }

  return NextResponse.json({ entry, mileage }, { status: 201 });
}
