"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function RetroCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-2 border-black bg-card text-card-foreground shadow-[var(--shadow-md)]",
        className
      )}
      {...props}
    />
  );
}

export function RetroCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-b-2 border-black p-4", className)} {...props} />
  );
}

export function RetroCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-head text-lg font-black uppercase", className)}
      {...props}
    />
  );
}

export function RetroCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />;
}
