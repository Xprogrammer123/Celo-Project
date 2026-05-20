"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  const next = Math.max(0, amount);
  localStorage.setItem(key, String(next));
  window.dispatchEvent(
    new CustomEvent("rova-balance-updated", { detail: { key, balance: next } })
  );
  return next;
}

type RovaBalanceContextValue = {
  balance: number;
  hydrated: boolean;
  isGuest: boolean;
  canAffordGame: boolean;
  gameCost: number;
  packSize: number;
  credit: (amount: number) => void;
  deduct: (amount: number) => boolean;
};

const RovaBalanceContext = createContext<RovaBalanceContextValue | null>(null);

export function RovaBalanceProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const key = storageKey(address);
  const isGuest = !isConnected || !address;

  const [balance, setBalance] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const syncBalance = useCallback(() => {
    setBalance(readBalance(key, isGuest));
  }, [key, isGuest]);

  useEffect(() => {
    syncBalance();
    setHydrated(true);
  }, [syncBalance]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      syncBalance();
    };

    const onRovaUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key !== key) return;
      syncBalance();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("rova-balance-updated", onRovaUpdated);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rova-balance-updated", onRovaUpdated);
    };
  }, [key, syncBalance]);

  const credit = useCallback(
    (amount: number) => {
      const current = readBalance(key, isGuest);
      const next = writeBalance(key, current + amount);
      setBalance(next);
    },
    [key, isGuest]
  );

  const deduct = useCallback(
    (amount: number): boolean => {
      const current = readBalance(key, isGuest);
      if (current < amount) return false;
      const next = writeBalance(key, current - amount);
      setBalance(next);
      return true;
    },
    [key, isGuest]
  );

  const value = useMemo(
    () => ({
      balance,
      hydrated,
      isGuest,
      canAffordGame: balance >= ROVA_PER_GAME,
      gameCost: ROVA_PER_GAME,
      packSize: ROVA_PER_CELO,
      credit,
      deduct,
    }),
    [balance, hydrated, isGuest, credit, deduct]
  );

  return (
    <RovaBalanceContext.Provider value={value}>
      {children}
    </RovaBalanceContext.Provider>
  );
}

export function useRovaBalance() {
  const ctx = useContext(RovaBalanceContext);
  if (!ctx) {
    throw new Error("useRovaBalance must be used within RovaBalanceProvider");
  }
  return ctx;
}
