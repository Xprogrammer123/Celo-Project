"use client";

import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";
import { cn } from "@/lib/utils";

export function RetroSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      className={cn("h-px w-full bg-black", className)}
      {...props}
    />
  );
}
