"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { configuredChain } from "@/constants/chains";
import { RetroButton } from "@/components/retroui/button";

export function WrongNetworkBanner() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  if (!isConnected || chain?.id === configuredChain.id) {
    return null;
  }

  return (
    <div className="bg-destructive px-4 py-3 text-destructive-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="font-sans text-sm font-bold">
          You&apos;re on the wrong network. Switch to{" "}
          {configuredChain.name} to play.
        </p>
        <RetroButton
          type="button"
          variant="secondary"
          className="whitespace-nowrap bg-white text-black hover:bg-neutral-200"
          onClick={() => switchChain({ chainId: configuredChain.id })}
        >
          SWITCH NETWORK
        </RetroButton>
      </div>
    </div>
  );
}