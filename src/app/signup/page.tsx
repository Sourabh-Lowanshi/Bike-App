"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json();

    if (!res.ok) {
      toast.error(body.error ?? "Failed to create account");
      return;
    }

    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      toast.success("Account created — please log in");
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm gradient-border">
        <div className="mb-6 text-center">
          <h1 className="pearl-text font-display text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-text-muted">Start tracking your ride.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your name" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>
          <Button type="submit" variant="pearl" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
            Create Account
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-muted">
          Already have an account? <Link href="/login" className="text-pearl-2 hover:underline">Log in</Link>
        </p>
      </Card>
    </div>
  );
}
