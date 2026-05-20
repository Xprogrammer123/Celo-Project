"use client";

import { useAccount } from "wagmi";
import {
  CELO_BUY_PACK,
  CELO_PER_GAME,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
} from "@/constants/rova";
import { gamesFromRova } from "@/lib/rova-math";
import { useRovaBalance } from "@/hooks/useRovaBalance";
import { useBuyRova } from "@/hooks/useBuyRova";
import { RetroButton } from "@/components/retroui/button";

export function RovaWallet() {
  const { isConnected } = useAccount();
  const { balance, hydrated, canAffordGame, isGuest } = useRovaBalance();
  const {
    buyPack,
    buyOneGame,
    buyMaxAffordable,
    buyPackDemo,
    isBuying,
    error,
    canBuyOneGame,
    canBuyPack,
    maxRovaFromWallet,
  } = useBuyRova();

  const gamesLeft = Math.floor(balance / ROVA_PER_GAME);

  return (
    <div className="border-2 border-border bg-card p-4 text-foreground">
      <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
        ROVA CELO
      </h3>
      <p className="font-sans text-[10px] text-muted-foreground mb-3">
        <strong className="text-foreground">1 CELO = {ROVA_PER_CELO} ROVA</strong>
        . One real game costs{" "}
        <strong className="text-foreground">
          {ROVA_PER_GAME} ROVA ({CELO_PER_GAME} CELO)
        </strong>
        .
      </p>

      <div className="flex items-end justify-between gap-3 border-2 border-black bg-muted px-3 py-3 mb-3">
        <div>
          <p className="font-sans text-[9px] tracking-widest text-muted-foreground">
            BALANCE
          </p>
          <p className="font-head text-3xl text-primary tabular-nums">
            {hydrated ? balance : "—"}
            <span className="text-sm text-muted-foreground ml-1">ROVA</span>
          </p>
        </div>
        <div className="text-right">
          <p className="font-sans text-[9px] text-muted-foreground">GAMES LEFT</p>
          <p className="font-head text-xl text-foreground">{gamesLeft}</p>
        </div>
      </div>

      {!canAffordGame && hydrated && isConnected && (
        <p className="font-sans text-xs text-muted-foreground mb-2">
          Need {ROVA_PER_GAME} ROVA to play. With your CELO you can get up to{" "}
          <strong>{maxRovaFromWallet} ROVA</strong> (
          {gamesFromRova(maxRovaFromWallet)} game
          {gamesFromRova(maxRovaFromWallet) !== 1 ? "s" : ""}).
        </p>
      )}

      {!canAffordGame && hydrated && (
        <p className="font-sans text-xs text-destructive mb-2">
          Not enough ROVA — buy below to play for real.
        </p>
      )}

      {isGuest ? (
        <div className="space-y-2">
          <RetroButton
            type="button"
            variant="outline"
            className="w-full text-xs"
            disabled={isBuying}
            onClick={() => buyPackDemo()}
          >
            + {ROVA_PER_CELO} ROVA (DEMO TOP-UP)
          </RetroButton>
          <p className="font-sans text-[10px] text-muted-foreground text-center">
            Guest demo starts with {balance} ROVA
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <RetroButton
            type="button"
            className="w-full text-sm"
            disabled={isBuying || !canBuyOneGame}
            onClick={() => void buyOneGame()}
          >
            {isBuying
              ? "CONFIRMING..."
              : `BUY 1 GAME — ${CELO_PER_GAME} CELO (${ROVA_PER_GAME} ROVA)`}
          </RetroButton>
          <RetroButton
            type="button"
            variant="outline"
            className="w-full text-xs"
            disabled={isBuying || !canBuyPack}
            onClick={() => void buyPack()}
          >
            BUY {ROVA_PER_CELO} ROVA FOR {CELO_BUY_PACK} CELO
          </RetroButton>
          <RetroButton
            type="button"
            variant="outline"
            className="w-full text-xs"
            disabled={isBuying || maxRovaFromWallet < ROVA_PER_GAME}
            onClick={() => void buyMaxAffordable()}
          >
            CONVERT ALL CELO → ~{maxRovaFromWallet} ROVA
          </RetroButton>
          {!canBuyOneGame && (
            <p className="font-sans text-[10px] text-destructive text-center">
              Need at least {CELO_PER_GAME} CELO for one game.
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="font-sans text-xs text-destructive mt-2">
          {error.message ?? "Purchase failed. Try again."}
        </p>
      )}
    </div>
  );
}
