"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "font-head inline-flex items-center border-2 border-black px-2 py-0.5 text-xs font-black uppercase",
  {
    variants: {
      variant: {
        common: "bg-white text-black",
        rare: "bg-primary text-black",
        epic: "bg-black text-white",
        legendary: "bg-black text-[#e63946]",
        muted: "bg-muted text-black",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  }
);

export interface RetroBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function RetroBadge({ className, variant, ...props }: RetroBadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
