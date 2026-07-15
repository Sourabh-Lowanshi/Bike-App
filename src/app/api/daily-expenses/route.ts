import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { DailyExpense } from "@/models/DailyExpense";
import { dailyExpenseSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const category = searchParams.get("category");

  await connectDB();
  const filter: Record<string, unknown> = { userId };
  if (category) filter.category = category;

  const expenses = await DailyExpense.find(filter).sort({ date: -1 }).limit(limit).lean();
  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await request.json();
  const parsed = dailyExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const expense = await DailyExpense.create({ ...parsed.data, userId });
  return NextResponse.json({ expense }, { status: 201 });
}
