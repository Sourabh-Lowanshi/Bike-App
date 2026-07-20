"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    setSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm gradient-border">
        <div className="mb-6 text-center">
          <h1 className="pearl-text font-display text-xl font-semibold">Reset your password</h1>
          <p className="mt-1 text-sm text-text-muted">We&apos;ll email you a one-time link.</p>
        </div>

        {sent ? (
          <p className="rounded-xl border border-success/20 bg-success/5 p-3 text-center text-sm text-text-secondary">
            If an account with that email exists, a reset link is on its way. It expires in 1 hour.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button type="submit" variant="pearl" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
              Send Reset Link
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-text-muted">
          <Link href="/login" className="text-pearl-2 hover:underline">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}
