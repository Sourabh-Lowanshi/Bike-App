"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

function LoginInner() {
  const params = useSearchParams();
  const router = useRouter();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    const result = await signIn("credentials", { ...data, redirect: false, callbackUrl });
    setSubmitting(false);
    if (result?.error) {
      toast.error("Incorrect email or password");
      return;
    }
    router.push(callbackUrl);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm gradient-border">
        <div className="mb-6 text-center">
          <h1 className="pearl-text font-display text-2xl font-semibold">BlackPearl</h1>
          <p className="mt-1 text-sm text-text-muted">TVS Apache RTR 160 4V · Fuel &amp; Maintenance Tracker</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="mb-1.5 text-xs text-pearl-2 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <Button type="submit" variant="pearl" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            Log In
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-muted">
          No account? <Link href="/signup" className="text-pearl-2 hover:underline">Sign up</Link>
        </p>

        <div className="my-5 flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-white/10" /> or <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="space-y-3">
          <Button variant="glass" className="w-full" onClick={() => signIn("google", { callbackUrl })}>
            Continue with Google
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => signIn("guest", { callbackUrl })}>
            Continue as Guest
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
