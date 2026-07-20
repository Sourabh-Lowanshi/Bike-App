import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";
import { generateResetToken } from "@/lib/password";
import { sendPasswordResetEmail, MailerNotConfiguredError } from "@/lib/services/mailer";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase().trim();

  await connectDB();
  const user = await User.findOne({ email });

  // Always return success, whether or not the account exists — this avoids
  // leaking which emails are registered ("account enumeration").
  const genericResponse = NextResponse.json({
    success: true,
    message: "If an account with that email exists, a reset link has been sent.",
  });

  if (!user) return genericResponse;

  const { rawToken, tokenHash, expiresAt } = generateResetToken();
  user.resetTokenHash = tokenHash;
  user.resetTokenExpiry = expiresAt;
  await user.save();

  const appUrl = process.env.APP_URL ?? new URL(request.url).origin;
  const resetLink = `${appUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail({ toEmail: user.email, userName: user.name, resetLink });
  } catch (err) {
    if (err instanceof MailerNotConfiguredError) {
      return NextResponse.json({ error: err.message, notConfigured: true }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 502 });
  }

  return genericResponse;
}
