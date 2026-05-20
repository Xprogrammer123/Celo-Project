"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import {
  CELO_BUY_PACK,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
} from "@/constants/rova";
import { useRovaBalance } from "@/hooks/useRovaBalance";
import { useBuyRova } from "@/hooks/useBuyRova";
import { RetroButton } from "@/components/retroui/button";

export function RovaWallet() {
  const { isConnected } = useAccount();
  const { balance, hydrated, canAffordGame, isGuest } = useRovaBalance();
  const { buyPack, buyPackDemo, isBuying, error } = useBuyRova();

  const gamesLeft = Math.floor(balance / ROVA_PER_GAME);

  return (
    <div className="border-2 border-border bg-card p-4 text-foreground">
      <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
        ROVA CELO
      </h3>
      <p className="font-sans text-[10px] text-muted-foreground mb-3">
        Play with ROVA credits — save real CELO.{" "}
        <strong className="text-foreground">
          1 CELO = {ROVA_PER_CELO} ROVA
        </strong>
        , each game costs{" "}
        <strong className="text-foreground">{ROVA_PER_GAME} ROVA</strong>.
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

      {!canAffordGame && hydrated && (
        <p className="font-sans text-xs text-destructive mb-2">
          Need {ROVA_PER_GAME} ROVA to play — buy a pack below.
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
            disabled={isBuying}
            onClick={() => void buyPack()}
          >
            {isBuying
              ? "CONFIRMING..."
              : `BUY ${ROVA_PER_CELO} ROVA FOR ${CELO_BUY_PACK} CELO`}
          </RetroButton>
          <ConnectButton showBalance={false} chainStatus="icon" />
        </div>
      )}

      {error && (
        <p className="font-sans text-xs text-destructive mt-2">
          Purchase failed. Try again.
        </p>
      )}

      <p className="font-sans text-[9px] text-muted-foreground mt-3">
        {ROVA_PER_CELO / ROVA_PER_GAME} games per 1 CELO pack at current rates
      </p>
    </div>
  );
}
