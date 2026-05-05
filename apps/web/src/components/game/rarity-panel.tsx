"use client";

import { RARITY_WEIGHTS } from "@/constants/rarity";
import { RetroBadge } from "@/components/retroui/badge";
import { RetroTooltip } from "@/components/retroui/tooltip";

const badgeVariant = {
  0: "common",
  1: "rare",
  2: "epic",
  3: "legendary",
} as const;

export function RarityOddsPanel() {
  return (
    <ul className="font-sans space-y-2 text-sm">
      {RARITY_WEIGHTS.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-2">
          <RetroTooltip
            content={`Rough lifetime odds around ${r.pct}% (VRF weighted).`}
          >
            <RetroBadge variant={badgeVariant[r.id]}>{r.label}</RetroBadge>
          </RetroTooltip>
          <span className="text-muted-foreground">{r.pct}%</span>
        </li>
      ))}
    </ul>
  );
}
