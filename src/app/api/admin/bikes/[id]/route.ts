import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { connectDB } from "@/lib/db";
import { Bike } from "@/models/Bike";
import { bikeSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await request.json();
  const parsed = bikeSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const bike = await Bike.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ bike });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await requireAdminSession();
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  await connectDB();
  const bike = await Bike.findByIdAndDelete(id);
  if (!bike) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
