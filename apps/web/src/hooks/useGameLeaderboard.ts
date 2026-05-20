"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getSortedLeaderboard,
  type LeaderboardMode,
} from "@/lib/player-profile";

export function useGameLeaderboard(mode: LeaderboardMode) {
  const [rows, setRows] = useState(() => getSortedLeaderboard(mode));
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(() => {
    setRows(getSortedLeaderboard(mode));
    setHydrated(true);
  }, [mode]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onUpdate = (event: Event) => {
      const custom = event as CustomEvent<{ mode?: LeaderboardMode }>;
      if (custom.detail?.mode && custom.detail.mode !== mode) return;
      reload();
    };
    window.addEventListener("rova-leaderboard-updated", onUpdate);
    window.addEventListener("rova-username-updated", onUpdate);
    return () => {
      window.removeEventListener("rova-leaderboard-updated", onUpdate);
      window.removeEventListener("rova-username-updated", onUpdate);
    };
  }, [mode, reload]);

  return { rows, hydrated, reload };
}
