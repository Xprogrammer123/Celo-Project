"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as React from "react";
import { cn } from "@/lib/utils";

export const RetroDialog = DialogPrimitive.Root;
export const RetroDialogTrigger = DialogPrimitive.Trigger;

export function RetroDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 border-2 border-black bg-background p-6 shadow-[var(--shadow-xl)] focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function RetroDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-head text-xl font-black uppercase", className)}
      {...props}
    />
  );
}

export function RetroDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn(
        "font-sans mt-2 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export function RetroDialogClose({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(
        "font-head mt-4 inline-flex border-2 border-black bg-primary px-4 py-2 text-sm font-black uppercase text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-muted",
        className
      )}
      {...props}
    />
  );
}
