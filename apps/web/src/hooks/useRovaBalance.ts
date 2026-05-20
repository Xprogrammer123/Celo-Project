"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  ROVA_DEMO_START,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
} from "@/constants/rova";

const GUEST_KEY = "demo-guest";

function storageKey(address: string | undefined) {
  return `rova-balance:${(address ?? GUEST_KEY).toLowerCase()}`;
}

function readBalance(key: string, isGuest: boolean): number {
  if (typeof window === "undefined") return isGuest ? ROVA_DEMO_START : 0;
  const raw = localStorage.getItem(key);
  if (raw !== null) {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return isGuest ? ROVA_DEMO_START : 0;
}

function writeBalance(key: string, amount: number) {
  localStorage.setItem(key, String(Math.max(0, amount)));
}

export function useRovaBalance() {
  const { address, isConnected } = useAccount();
  const key = storageKey(address);
  const isGuest = !isConnected || !address;

  const [balance, setBalance] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBalance(readBalance(key, isGuest));
    setHydrated(true);
  }, [key, isGuest]);

  const persist = useCallback(
    (next: number) => {
      const clamped = Math.max(0, next);
      writeBalance(key, clamped);
      setBalance(clamped);
    },
    [key]
  );

  const credit = useCallback(
    (amount: number) => {
      setBalance((b) => {
        const next = b + amount;
        writeBalance(key, next);
        return next;
      });
    },
    [key]
  );

  const deduct = useCallback(
    (amount: number): boolean => {
      if (balance < amount) return false;
      persist(balance - amount);
      return true;
    },
    [balance, persist]
  );

  const canAffordGame = balance >= ROVA_PER_GAME;

  return {
    balance,
    hydrated,
    isGuest,
    canAffordGame,
    gameCost: ROVA_PER_GAME,
    packSize: ROVA_PER_CELO,
    credit,
    deduct,
    persist,
  };
}
