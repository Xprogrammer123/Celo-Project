"use client";

import { useState } from "react";
import { useGameLeaderboard } from "@/hooks/useGameLeaderboard";
import { usePlayerUsername } from "@/hooks/usePlayerUsername";
import { displayName } from "@/lib/player-profile";
import type { LeaderboardMode } from "@/lib/player-profile";
import { RetroBadge } from "@/components/retroui/badge";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroCard,
  RetroCardContent,
  RetroCardHeader,
  RetroCardTitle,
} from "@/components/retroui/card";
import { RetroSeparator } from "@/components/retroui/separator";
import { WalletProfileButton } from "@/components/wallet-profile-button";

function LeaderboardTable({ mode }: { mode: LeaderboardMode }) {
  const { rows, hydrated } = useGameLeaderboard(mode);
  const { playerId } = usePlayerUsername();
  const isLoading = !hydrated;

  return (
    <>
      <RetroCard className="hidden md:block">
        <RetroCardHeader className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b-2 border-black py-3">
          <RetroCardTitle className="text-sm">RANK</RetroCardTitle>
          <RetroCardTitle className="text-sm">PLAYER</RetroCardTitle>
          <RetroCardTitle className="text-sm">NFT RUNS</RetroCardTitle>
          <RetroCardTitle className="text-sm">WINS</RetroCardTitle>
          <RetroCardTitle className="text-sm">BEST</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent className="p-0">
          {isLoading && (
            <p className="p-6 font-sans text-sm">LOADING LEADERBOARD…</p>
          )}
          {!isLoading &&
            rows.map((r) => (
              <div
                key={r.playerId}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 border-b-2 border-black px-4 py-3 font-sans text-sm last:border-b-0 ${
                  r.playerId === playerId ? "bg-muted" : ""
                }`}
              >
                <span className="font-head font-black tabular-nums">
                  {r.rank === 1 ? "👑" : ""} {r.rank}
                </span>
                <span className="truncate font-head text-xs uppercase">
                  {r.name}
                  {r.playerId === playerId ? (
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      (YOU)
                    </span>
                  ) : null}
                </span>
                <RetroBadge variant="legendary">{r.nftRuns}</RetroBadge>
                <span className="tabular-nums">{r.wins}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.bestStreak}/3
                </span>
              </div>
            ))}
          {!isLoading && rows.length === 0 && (
            <p className="p-6 font-sans text-sm">
              NO SCORES YET. PLAY ON /PLAY TO CLAIM RANK #1.
            </p>
          )}
        </RetroCardContent>
      </RetroCard>

      <div className="space-y-4 md:hidden">
        {isLoading && (
          <p className="font-sans text-sm">LOADING LEADERBOARD…</p>
        )}
        {!isLoading &&
          rows.map((r) => (
            <RetroCard
              key={r.playerId}
              className={r.playerId === playerId ? "ring-2 ring-primary" : ""}
            >
              <RetroCardHeader className="flex flex-row items-center justify-between">
                <span className="font-head text-lg font-black">
                  {r.rank === 1 ? "👑 " : ""}#{r.rank} {r.name}
                </span>
                <RetroBadge variant="legendary">{r.nftRuns} NFT</RetroBadge>
              </RetroCardHeader>
              <RetroCardContent className="space-y-2 font-sans text-xs">
                <p className="text-muted-foreground">
                  Wins: {r.wins} · Best streak: {r.bestStreak}/3
                </p>
                {r.playerId === playerId && (
                  <>
                    <RetroSeparator />
                    <p className="font-bold">That&apos;s you!</p>
                  </>
                )}
              </RetroCardContent>
            </RetroCard>
          ))}
        {!isLoading && rows.length === 0 && (
          <p className="font-sans text-sm">NO SCORES YET.</p>
        )}
      </div>
    </>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderboardMode>("demo");
  const { playerId, username } = usePlayerUsername();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-head mb-2 text-3xl font-black uppercase md:text-4xl">
            LEADERBOARD
          </h1>
          <p className="font-sans text-sm text-muted-foreground max-w-xl">
            Separate boards for Demo and Real play. Set your username in the
            wallet button — that name shows here instead of your address.
          </p>
        </div>
        <WalletProfileButton />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <RetroButton
          type="button"
          size="sm"
          variant={tab === "demo" ? "default" : "outline"}
          onClick={() => setTab("demo")}
        >
          DEMO
        </RetroButton>
        <RetroButton
          type="button"
          size="sm"
          variant={tab === "real" ? "default" : "outline"}
          onClick={() => setTab("real")}
        >
          REAL
        </RetroButton>
        <span className="font-sans text-xs text-muted-foreground ml-2">
          Playing as: <strong>{displayName(playerId)}</strong>
          {username ? "" : " — set a username in the wallet button"}
        </span>
      </div>

      <LeaderboardTable mode={tab} key={tab} />
    </div>
  );
}
