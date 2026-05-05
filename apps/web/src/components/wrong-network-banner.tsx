"use client";

import { baseSepolia } from "wagmi/chains";
import { useAccount, useSwitchChain } from "wagmi";
import { RetroButton } from "@/components/retroui/button";

export function WrongNetworkBanner() {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chain?.id === baseSepolia.id) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3 border-b-2 border-black bg-primary px-4 py-3 text-center font-sans text-sm font-semibold text-primary-foreground"
      role="status"
    >
      WRONG NETWORK — SWITCH TO BASE SEPOLIA TO PLAY.
      <RetroButton
        type="button"
        variant="secondary"
        className="text-xs uppercase"
        disabled={isPending}
        onClick={() => switchChain({ chainId: baseSepolia.id })}
      >
        {isPending ? "SWITCHING…" : "SWITCH NOW"}
      </RetroButton>
    </div>
  );
}
