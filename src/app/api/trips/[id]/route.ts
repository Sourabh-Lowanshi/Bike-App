import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Trip } from "@/models/Trip";
import { tripEndSchema } from "@/lib/validations";

// End an active ride: pass computed distance/duration/avg speed + polyline.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await request.json();
  const parsed = tripEndSchema.safeParse({ ...body, tripId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  await connectDB();
  const averageSpeed =
    data.duration > 0 ? Number(((data.distance / data.duration) * 3600).toFixed(1)) : 0;

  const trip = await Trip.findOneAndUpdate(
    { _id: id, userId, status: "active" },
    {
      $set: {
        endLocation: { lat: data.lat, lng: data.lng, name: data.name },
        distance: data.distance,
        duration: data.duration,
        averageSpeed,
        routePolyline: data.routePolyline,
        status: "completed",
      },
    },
    { new: true }
  );

  if (!trip) return NextResponse.json({ error: "Active trip not found" }, { status: 404 });
  return NextResponse.json({ trip });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await connectDB();
  const trip = await Trip.findOneAndDelete({ _id: id, userId });
  if (!trip) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
