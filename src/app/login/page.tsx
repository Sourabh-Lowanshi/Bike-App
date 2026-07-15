"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function LoginInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm gradient-border text-center">
        <h1 className="pearl-text font-display text-2xl font-semibold">BlackPearl</h1>
        <p className="mt-1 mb-8 text-sm text-text-muted">TVS Apache RTR 160 4V · Fuel &amp; Maintenance Tracker</p>

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
