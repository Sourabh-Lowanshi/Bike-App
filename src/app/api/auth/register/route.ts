import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Bike } from "@/models/Bike";
import { registerSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/password";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists. Try logging in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const role = ADMIN_EMAILS.includes(email) ? "admin" : "user";
  const user = await User.create({ name, email, passwordHash, role });

  await Bike.create({
    userId: user._id,
    bikeName: "BlackPearl",
    bikeModel: "Apache RTR 160 4V",
    brand: "TVS",
    color: "Black",
    tankCapacity: 12,
    fuelType: "Petrol",
    currentOdometer: 0,
    isDefault: true,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
