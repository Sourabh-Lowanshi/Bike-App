import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { Bike } from "@/models/Bike";
import { bikeSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  await connectDB();
  const bike = await Bike.findOne({ _id: id, userId }).lean();
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bike });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const body = await request.json();
  const { setDefault, ...fields } = body;
  const parsed = bikeSchema.partial().safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();

  if (setDefault) {
    await Bike.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const bike = await Bike.findOneAndUpdate(
    { _id: id, userId },
    { $set: { ...parsed.data, ...(setDefault ? { isDefault: true } : {}) } },
    { new: true }
  );
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bike });
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

  const remaining = await Bike.countDocuments({ userId });
  if (remaining <= 1) {
    return NextResponse.json(
      { error: "You need at least one bike — add another before deleting this one." },
      { status: 400 }
    );
  }

  const bike = await Bike.findOneAndDelete({ _id: id, userId });
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If we deleted the default bike, promote another one.
  if (bike.isDefault) {
    const next = await Bike.findOne({ userId });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return NextResponse.json({ success: true });
}
