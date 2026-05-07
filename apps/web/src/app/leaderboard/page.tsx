"use client";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { RetroBadge } from "@/components/retroui/badge";
import {
  RetroCard,
  RetroCardContent,
  RetroCardHeader,
  RetroCardTitle,
} from "@/components/retroui/card";
import { RetroSeparator } from "@/components/retroui/separator";

export default function LeaderboardPage() {
  const { rows, totalScratchesFor, isLoading } = useLeaderboard();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-head mb-2 text-3xl font-black uppercase md:text-4xl">
        LEGENDARY LEADERBOARD
      </h1>
      <p className="font-sans mb-8 text-sm text-muted-foreground">
        Top 10 wallets by Legendary pulls (last ~50k blocks on Celo).
        Refreshes every 30 seconds.
      </p>

      <RetroCard className="hidden md:block">
        <RetroCardHeader className="flex flex-row items-center justify-between gap-4 border-b-2 border-black py-3">
          <RetroCardTitle className="text-sm">RANK</RetroCardTitle>
          <RetroCardTitle className="text-sm">WALLET</RetroCardTitle>
          <RetroCardTitle className="text-sm">LEGENDARIES</RetroCardTitle>
          <RetroCardTitle className="text-sm">SCRATCHES</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent className="p-0">
          {isLoading && (
            <p className="p-6 font-sans text-sm">LOADING THE FLEX…</p>
          )}
          {!isLoading &&
            rows.map((r) => (
              <div
                key={r.address}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b-2 border-black px-4 py-3 font-sans text-sm last:border-b-0"
              >
                <span className="font-head font-black tabular-nums">
                  {r.rank === 1 ? "👑" : ""} {r.rank}
                </span>
                <span className="truncate font-mono text-xs">{r.address}</span>
                <RetroBadge variant="legendary">{r.legendary}</RetroBadge>
                <span className="tabular-nums text-muted-foreground">
                  {totalScratchesFor(r.address)}
                </span>
              </div>
            ))}
          {!isLoading && rows.length === 0 && (
            <p className="p-6 font-sans text-sm">
              NO LEGENDARIES LOGGED IN RANGE YET. BE THE FIRST DEGEN.
            </p>
          )}
        </RetroCardContent>
      </RetroCard>

      <div className="space-y-4 md:hidden">
        {isLoading && (
          <p className="font-sans text-sm">LOADING THE FLEX…</p>
        )}
        {!isLoading &&
          rows.map((r) => (
          <RetroCard key={r.address}>
            <RetroCardHeader className="flex flex-row items-center justify-between">
              <span className="font-head text-lg font-black">
                {r.rank === 1 ? "👑 " : ""}#{r.rank}
              </span>
              <RetroBadge variant="legendary">{r.legendary} LEG</RetroBadge>
            </RetroCardHeader>
            <RetroCardContent className="space-y-2 font-sans text-xs">
              <p className="break-all font-mono">{r.address}</p>
              <RetroSeparator />
              <p className="text-muted-foreground">
                Scratches (sampled): {totalScratchesFor(r.address)}
              </p>
            </RetroCardContent>
          </RetroCard>
        ))}
        {!isLoading && rows.length === 0 && (
          <p className="font-sans text-sm">
            NO LEGENDARIES LOGGED IN RANGE YET.
          </p>
        )}
      </div>
    </div>
  );
}
