"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "font-head inline-flex items-center justify-center border-2 border-black text-sm font-bold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-md)] hover:bg-[#fae583] active:translate-x-px active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[var(--shadow-sm)] hover:bg-neutral-800",
        outline:
          "border-2 border-black bg-background text-foreground shadow-[var(--shadow-sm)] hover:bg-muted",
        ghost: "border-0 bg-transparent shadow-none hover:bg-muted",
        win: "border-2 border-black bg-win text-win-foreground shadow-[var(--shadow-md)]",
        destructive:
          "border-2 border-black bg-destructive text-destructive-foreground shadow-[var(--shadow-sm)]",
      },
      size: {
        default: "h-12 min-w-[8rem] px-6 py-2",
        sm: "h-9 min-w-0 px-3 text-xs",
        lg: "h-14 min-w-[12rem] px-8 text-base",
        icon: "h-10 w-10 min-w-0 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface RetroButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function RetroButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: RetroButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
