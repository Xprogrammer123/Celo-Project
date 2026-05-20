"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useDisconnect } from "wagmi";
import { usePlayerUsername } from "@/hooks/usePlayerUsername";
import { displayName, formatPlayerId } from "@/lib/player-profile";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroDialog,
  RetroDialogContent,
  RetroDialogDescription,
  RetroDialogTitle,
} from "@/components/retroui/dialog";
import { RetroInput } from "@/components/retroui/input";

export function WalletProfileButton() {
  const { disconnect } = useDisconnect();
  const { playerId, username, hydrated, isConnected, saveUsername } =
    usePlayerUsername();
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
              <p className="text-xs text-muted-foreground break-all font-mono">
                {playerId}
              </p>
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
