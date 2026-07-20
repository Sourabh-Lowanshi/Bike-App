"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { resetPasswordSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

type FormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const onSubmit = async (data: FormValues) => {
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Something went wrong");
      return;
    }
    router.push("/login");
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm gradient-border text-center">
          <p className="text-sm text-text-secondary">
            This reset link is missing its token. Request a new one from the{" "}
            <Link href="/forgot-password" className="text-pearl-2 hover:underline">forgot password</Link> page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm gradient-border">
        <div className="mb-6 text-center">
          <h1 className="pearl-text font-display text-xl font-semibold">Set a new password</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="hidden" {...register("token")} />
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          <Button type="submit" variant="pearl" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
