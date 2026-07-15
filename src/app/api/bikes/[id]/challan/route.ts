import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Bike } from "@/models/Bike";
import { fetchChallanStatus, ComplianceNotConfiguredError } from "@/lib/services/vehicle-compliance";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — avoid burning paid API quota

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  await connectDB();
  const bike = await Bike.findOne({ _id: id, userId });
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!bike.registrationNumber) {
    return NextResponse.json(
      { error: "Add this bike's registration number first (Garage → Edit)." },
      { status: 400 }
    );
  }

  const cached = bike.challanCache;
  const isFresh = cached && Date.now() - new Date(cached.checkedAt).getTime() < CACHE_TTL_MS;
  if (isFresh && !forceRefresh) {
    return NextResponse.json({ challan: cached, cached: true });
  }

  try {
    const result = await fetchChallanStatus(bike.registrationNumber);
    bike.challanCache = { ...result, checkedAt: new Date() };
    await bike.save();
    return NextResponse.json({ challan: bike.challanCache, cached: false });
  } catch (err) {
    if (err instanceof ComplianceNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Challan lookup failed" },
      { status: 502 }
    );
  }
}
