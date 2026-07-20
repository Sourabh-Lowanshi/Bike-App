import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { resetPasswordSchema } from "@/lib/validations";
import { hashPassword, hashResetToken } from "@/lib/password";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  await connectDB();
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiry: { $gt: new Date() },
  }).select("+resetTokenHash +resetTokenExpiry");

  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  return NextResponse.json({ success: true });
}
