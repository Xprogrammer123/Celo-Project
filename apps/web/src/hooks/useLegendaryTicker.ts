"use client";

import { useState } from "react";
import type { Address } from "viem";
import { useWatchContractEvent } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";

function shortAddr(a: string) {
  return `${a.slice(0, 5)}…${a.slice(-4)}`;
}

export type TickerItem = { id: string; text: string; live: boolean };

const SEED: TickerItem[] = [
  { id: "s1", text: "0x3f2a…22a1 JUST WON LEGENDARY", live: false },
  { id: "s2", text: "0xab91…99c2 SNAGGED RARE", live: false },
  { id: "s3", text: "0xd04e…01ff EPIC DROP", live: false },
  { id: "s4", text: "0x88c0…4e11 COMMON (STILL HUNGRY)", live: false },
];

export function useLegendaryTicker() {
  const [extra, setExtra] = useState<TickerItem[]>([]);

  useWatchContractEvent({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    eventName: "LegendaryMinted",
    enabled: isContractConfigured,
    onLogs(logs) {
      setExtra((e) => {
        const next = logs.map((log, i) => {
          const rec = log as {
            blockNumber?: bigint;
            args?: { player?: Address };
          };
          const p = rec.args?.player;
          const a = p ? shortAddr(p) : "unknown";
          return {
            id: `${rec.blockNumber}-${i}-${a}`,
            text: `${a} JUST WON LEGENDARY`,
            live: true as const,
          };
        });
        return [...next, ...e].slice(0, 24);
      });
    },
  });

  return { items: [...extra, ...SEED] };
}
