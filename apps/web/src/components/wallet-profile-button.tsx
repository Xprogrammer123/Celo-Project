"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useBalance, useDisconnect } from "wagmi";
import { configuredChain } from "@/constants/chains";
import { usePlayerUsername } from "@/hooks/usePlayerUsername";
import { useRovaBalance } from "@/hooks/useRovaBalance";
import { useBuyRova } from "@/hooks/useBuyRova";
import { ROVA_PACKS, ROVA_PER_GAME } from "@/constants/rova";
import { displayName, formatPlayerId } from "@/lib/player-profile";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroDialog,
  RetroDialogContent,
  RetroDialogDescription,
  RetroDialogTitle,
} from "@/components/retroui/dialog";
import { RetroInput } from "@/components/retroui/input";

function formatCelo(wei: bigint | undefined) {
  if (wei === undefined) return "—";
  const n = Number(formatEther(wei));
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

export function WalletProfileButton() {
  const { disconnect } = useDisconnect();
  const { playerId, username, hydrated, isConnected, saveUsername } =
    usePlayerUsername();
  const { balance: rovaBalance, hydrated: rovaHydrated } = useRovaBalance();
  const { buyRovaPack, isBuying, canAffordCelo } = useBuyRova();
  const { data: celoBalance, isLoading: celoLoading } = useBalance({
    address: isConnected ? (playerId as `0x${string}`) : undefined,
    chainId: configuredChain.id,
  });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const label =
    hydrated && (username || isConnected)
      ? displayName(playerId)
      : "CONNECT";

  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openConnectModal,
          mounted,
        }) => {
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <RetroButton
              type="button"
              size="sm"
              variant={connected ? "secondary" : "default"}
              className="min-w-0 px-3"
              onClick={() => {
                if (!connected) {
                  openConnectModal();
                  return;
                }
                setDraft(username);
                setOpen(true);
              }}
            >
              {!ready ? "…" : connected ? label : "CONNECT"}
            </RetroButton>
          );
        }}
      </ConnectButton.Custom>

      <RetroDialog open={open} onOpenChange={setOpen}>
        <RetroDialogContent>
          <RetroDialogTitle>WALLET PROFILE</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-2 space-y-4">
            {isConnected && (
              <>
                <p className="text-xs text-muted-foreground break-all font-mono">
                  {playerId}
                </p>
                <div className="grid grid-cols-2 gap-2 border-2 border-black bg-muted p-3">
                  <div>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">
                      CELO balance
                    </p>
                    <p className="font-head text-xl tabular-nums">
                      {celoLoading
                        ? "…"
                        : `${formatCelo(celoBalance?.value)} CELO`}
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">
                      ROVA balance
                    </p>
                    <p className="font-head text-xl tabular-nums text-primary">
                      {rovaHydrated ? rovaBalance : "…"} ROVA
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label
                htmlFor="rova-username"
                className="font-head text-xs uppercase tracking-widest"
              >
                Leaderboard username
              </label>
              <RetroInput
                id="rova-username"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Your display name"
                maxLength={20}
              />
              <p className="text-[10px] text-muted-foreground">
                This name appears on Demo and Real leaderboards. Max 20
                characters.
              </p>
            </div>

            {isConnected && (
              <RetroButton
                type="button"
                className="w-full"
                disabled={isBuying || !canAffordCelo(ROVA_PACKS[0].celo)}
                onClick={() => void buyRovaPack(ROVA_PACKS[0])}
              >
                {isBuying
                  ? "CONFIRMING..."
                  : `BUY ${ROVA_PACKS[0].rova} ROVA (${ROVA_PACKS[0].celo} CELO)`}
              </RetroButton>
            )}

            <div className="grid gap-2">
              <RetroButton
                type="button"
                onClick={() => {
                  saveUsername(draft);
                  setOpen(false);
                }}
              >
                SAVE USERNAME
              </RetroButton>
              {isConnected && (
                <RetroButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                >
                  DISCONNECT
                </RetroButton>
              )}
            </div>

            {!isConnected && (
              <p className="text-xs text-muted-foreground">
                Playing as <strong>{formatPlayerId(playerId)}</strong>. Connect
                a wallet to link your username to your address.
              </p>
            )}
          </RetroDialogDescription>
        </RetroDialogContent>
      </RetroDialog>
    </>
  );
}
