import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Maintenance } from "@/models/Maintenance";
import { Bike } from "@/models/Bike";
import { maintenanceSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const bikeId = searchParams.get("bikeId");

  await connectDB();
  const query: Record<string, unknown> = { userId };
  if (category) query.category = category;
  if (bikeId) query.bikeId = bikeId;

  const records = await Maintenance.find(query).sort({ date: -1 }).lean();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const parsed = maintenanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const bike = await Bike.findOne({ _id: parsed.data.bikeId, userId });
  if (!bike) return NextResponse.json({ error: "Bike not found" }, { status: 404 });

  const record = await Maintenance.create({ ...parsed.data, userId, bikeId: bike._id });
  return NextResponse.json({ record }, { status: 201 });
}
