import { Card, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "pearl" | "danger" | "success";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-white/5",
            accent === "pearl" && "text-pearl-2",
            accent === "danger" && "text-danger",
            accent === "success" && "text-success"
          )}
        >
          <Icon size={16} />
        </div>
      </CardHeader>
      <CardValue>{value}</CardValue>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </Card>
  );
}
