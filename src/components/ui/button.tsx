import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearl-2/50",
  {
    variants: {
      variant: {
        primary:
          "bg-text-primary text-bg hover:opacity-90 active:scale-[0.98]",
        pearl:
          "text-bg bg-[linear-gradient(135deg,var(--pearl-1),var(--pearl-2),var(--pearl-3))] hover:brightness-110 active:scale-[0.98]",
        glass:
          "glass glass-hover text-text-primary",
        ghost: "text-text-secondary hover:text-text-primary hover:bg-white/5",
        danger: "bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-13 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";
