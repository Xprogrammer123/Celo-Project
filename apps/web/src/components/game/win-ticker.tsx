"use client";

import { useLegendaryTicker, type TickerItem } from "@/hooks/useLegendaryTicker";
import { cn } from "@/lib/utils";

function TickerRun({ items }: { items: TickerItem[] }) {
  const line = items.map((i) => i.text).join("  •  ");
  return (
    <div className="flex w-max gap-8 whitespace-nowrap">
      <span className="font-sans text-sm font-bold tracking-wide text-foreground">
        {line}
      </span>
      <span
        className="font-sans text-sm font-bold tracking-wide text-foreground"
        aria-hidden
      >
        {line}
      </span>
    </div>
  );
}

export function WinTicker({ className }: { className?: string }) {
  const { items } = useLegendaryTicker();
  return (
    <div
      className={cn(
        "overflow-hidden border-y-2 border-black bg-[#fae583]/30 py-2",
        className
      )}
    >
      <div className="animate-ticker hover:[animation-play-state:paused] flex w-max">
        <TickerRun items={items} />
      </div>
    </div>
  );
}
