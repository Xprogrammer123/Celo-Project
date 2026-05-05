"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as React from "react";
import { cn } from "@/lib/utils";

export function RetroProgress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const v = Math.min(100, Math.max(0, value ?? 0));
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-4 w-full overflow-hidden border-2 border-black bg-white shadow-[var(--shadow-sm)]",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        <div
          className="h-full bg-primary transition-[width] duration-150 ease-out"
          style={{ width: `${v}%` }}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}
