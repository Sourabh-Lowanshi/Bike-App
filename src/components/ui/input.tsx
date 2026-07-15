import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-border-glass bg-white/[0.03] px-4 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-pearl-2/60 focus:bg-white/[0.05]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full rounded-xl border border-border-glass bg-white/[0.03] px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-pearl-2/60 focus:bg-white/[0.05]",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-medium text-text-secondary", className)}
      {...props}
    />
  );
}
