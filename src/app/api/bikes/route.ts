import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Bike } from "@/models/Bike";
import { bikeSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  await connectDB();
  const bikes = await Bike.find({ userId }).sort({ isDefault: -1, createdAt: 1 }).lean();
  return NextResponse.json({ bikes });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const parsed = bikeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const existingCount = await Bike.countDocuments({ userId });
  const bike = await Bike.create({ ...parsed.data, userId, isDefault: existingCount === 0 });
  return NextResponse.json({ bike }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const { bikeId, ...updates } = body;
  if (!bikeId) return NextResponse.json({ error: "bikeId is required" }, { status: 400 });

  const parsed = bikeSchema.partial().safeParse(updates);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const bike = await Bike.findOneAndUpdate(
    { _id: bikeId, userId },
    { $set: parsed.data },
    { new: true }
  );
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bike });
}
