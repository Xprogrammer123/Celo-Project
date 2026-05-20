"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  DEMO_PLAYER_ID,
  getUsername,
  setUsername,
} from "@/lib/player-profile";

export function usePlayerUsername() {
  const { address, isConnected } = useAccount();
  const playerId = (address ?? DEMO_PLAYER_ID).toLowerCase();

  const [username, setLocalUsername] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const sync = useCallback(() => {
    setLocalUsername(getUsername(playerId));
    setHydrated(true);
  }, [playerId]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUpdate = (event: Event) => {
      const custom = event as CustomEvent<{ playerId?: string }>;
      if (custom.detail?.playerId?.toLowerCase() !== playerId) return;
      sync();
    };
    window.addEventListener("rova-username-updated", onUpdate);
    return () => window.removeEventListener("rova-username-updated", onUpdate);
  }, [playerId, sync]);

  const saveUsername = useCallback(
    (next: string) => {
      setUsername(playerId, next);
      setLocalUsername(getUsername(playerId));
    },
    [playerId]
  );

  return {
    playerId,
    username,
    hydrated,
    isConnected,
    isGuest: !isConnected || !address,
    saveUsername,
  };
}
