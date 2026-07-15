import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Trip } from "@/models/Trip";
import { Bike } from "@/models/Bike";
import { tripStartSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const status = searchParams.get("status");
  const bikeId = searchParams.get("bikeId");

  await connectDB();
  const query: Record<string, unknown> = { userId };
  if (status) query.status = status;
  if (bikeId) query.bikeId = bikeId;

  const trips = await Trip.find(query).sort({ date: -1 }).limit(limit).lean();
  return NextResponse.json({ trips });
}

// Start a new ride. The client should keep pinging the browser's geolocation
// API and update the trip document (or just hold points locally and PATCH
// on end — see /api/trips/[id]).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const parsed = tripStartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const bike = await Bike.findOne({ _id: parsed.data.bikeId, userId });
  if (!bike) return NextResponse.json({ error: "Bike not found" }, { status: 404 });

  // Guard against duplicate active rides for this bike.
  const existingActive = await Trip.findOne({ userId, bikeId: bike._id, status: "active" });
  if (existingActive) {
    return NextResponse.json({ trip: existingActive });
  }

  const trip = await Trip.create({
    userId,
    bikeId: bike._id,
    startLocation: { lat: parsed.data.lat, lng: parsed.data.lng, name: parsed.data.name },
    status: "active",
    date: new Date(),
  });

  return NextResponse.json({ trip }, { status: 201 });
}
