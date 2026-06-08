"use client";

import { useAccount } from "wagmi";
import { ROVA_PACKS, ROVA_PER_CELO, ROVA_PER_GAME } from "@/constants/rova";
import { useBuyRova } from "@/hooks/useBuyRova";
import { RetroButton } from "@/components/retroui/button";
import { StatusNote } from "@/components/ui/status-note";

export function RovaPackShop() {
  const { isConnected } = useAccount();
  const { buyRovaPack, isBuying, status, canAffordCelo } = useBuyRova();

  return (
    <div className="border-2 border-[#ffd700] bg-card p-4">
      <h3 className="font-head text-sm font-black uppercase tracking-widest text-[#ffd700] mb-2">
        BUY ROVA
      </h3>
      <p className="font-sans text-[10px] text-muted-foreground mb-3">
        Tap a pack, pay CELO in your wallet, get ROVA instantly.{" "}
        <strong className="text-foreground">{ROVA_PER_GAME} ROVA</strong> per
        game.
      </p>

      <div className="space-y-2">
        {ROVA_PACKS.map((pack) => (
          <RetroButton
            key={pack.rova}
            type="button"
            variant={pack.rova === ROVA_PER_CELO ? "default" : "outline"}
            className="w-full text-xs flex justify-between"
            disabled={
              isBuying || !isConnected || !canAffordCelo(pack.celo)
            }
            onClick={() => void buyRovaPack(pack)}
          >
            <span>{pack.rova} ROVA</span>
            <span>{pack.celo} CELO</span>
          </RetroButton>
        ))}

        {!isConnected && (
          <p className="font-sans text-[10px] text-muted-foreground text-center pt-1">
            Connect wallet to pay with CELO
          </p>
        )}
      </div>

      <StatusNote className="mt-2">{status}</StatusNote>
    </div>
  );
}
