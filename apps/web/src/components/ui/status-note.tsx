import type { ReactNode } from "react";

/** Soft inline status — not an error banner. */
export function StatusNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  if (!children) return null;
  return (
    <p
      className={`font-sans text-xs text-muted-foreground ${className}`.trim()}
    >
      {children}
    </p>
  );
}
