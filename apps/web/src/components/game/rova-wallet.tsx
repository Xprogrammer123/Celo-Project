"use client";

import { ROVA_PER_GAME } from "@/constants/rova";
import { useRovaBalance } from "@/hooks/useRovaBalance";
import { RetroButton } from "@/components/retroui/button";
import { useBuyRova } from "@/hooks/useBuyRova";

export function RovaWallet() {
  const { balance, hydrated, canAffordGame, isGuest } = useRovaBalance();
  const { buyPackDemo, isBuying } = useBuyRova();

  const gamesLeft = Math.floor(balance / ROVA_PER_GAME);

  return (
    <div className="border-2 border-border bg-card p-4 text-foreground">
      <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
        YOUR ROVA
      </h3>

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

      {!canAffordGame && hydrated && !isGuest && (
        <p className="font-sans text-xs text-muted-foreground mb-2">
          Need {ROVA_PER_GAME} ROVA per game — buy a pack below.
        </p>
      )}

      {isGuest && (
        <div className="space-y-2">
          <RetroButton
            type="button"
            variant="outline"
            className="w-full text-xs"
            disabled={isBuying}
            onClick={() => buyPackDemo()}
          >
            + DEMO ROVA (FREE)
          </RetroButton>
          <p className="font-sans text-[10px] text-muted-foreground text-center">
            Guest starts with {balance} ROVA · connect wallet to buy with CELO
          </p>
        </div>
      )}
    </div>
  );
}
