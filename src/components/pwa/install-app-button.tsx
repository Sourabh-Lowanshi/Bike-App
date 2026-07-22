"use client";

import { useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { toast } from "sonner";

export function InstallAppButton({ variant = "pearl" as const }: { variant?: "pearl" | "glass" }) {
  const { canPromptInstall, promptInstall, isStandalone, isIos } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (isStandalone) return null; // already installed — nothing to do
  if (!canPromptInstall && !isIos) return null; // no install path available on this browser

  const handleClick = async () => {
    if (canPromptInstall) {
      const outcome = await promptInstall();
      if (outcome === "accepted") toast.success("BlackPearl is installing…");
      return;
    }
    if (isIos) setShowIosGuide(true);
  };

  return (
    <>
      <Button variant={variant} size="sm" onClick={handleClick}>
        <Download size={14} /> Install App
      </Button>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="w-full max-w-sm gradient-border">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-text-primary">Install BlackPearl</h3>
              <button onClick={() => setShowIosGuide(false)} className="text-text-muted hover:text-text-primary">
                <X size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-text-secondary">
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <Share size={14} />
                </span>
                Tap the <strong className="text-text-primary">Share</strong> button in Safari&apos;s toolbar
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <SquarePlus size={14} />
                </span>
                Scroll down and tap <strong className="text-text-primary">Add to Home Screen</strong>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs font-medium text-text-primary">
                  3
                </span>
                Tap <strong className="text-text-primary">Add</strong> — BlackPearl now opens full-screen from your home screen
              </li>
            </ol>
          </Card>
        </div>
      )}
    </>
  );
}
