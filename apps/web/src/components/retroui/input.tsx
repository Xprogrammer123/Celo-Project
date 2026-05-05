"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const RetroInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function RetroInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "font-sans flex h-11 w-full border-2 border-black bg-background px-3 py-2 text-sm shadow-[var(--shadow-sm)] placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-black",
        className
      )}
      {...props}
    />
  );
});
