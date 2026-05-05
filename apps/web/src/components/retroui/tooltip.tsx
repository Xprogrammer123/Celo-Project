"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";

export function RetroTooltipProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function RetroTooltip({
  children,
  content,
  className,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={cn(
            "font-sans z-50 max-w-xs border-2 border-black bg-muted px-2 py-1 text-xs text-black shadow-[var(--shadow-sm)]",
            className
          )}
          sideOffset={5}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
