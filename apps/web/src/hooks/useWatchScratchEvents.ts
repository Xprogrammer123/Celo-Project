"use client";

import { useEffect, useRef } from "react";
import type { Address } from "viem";
import { useAccount, useWatchContractEvent } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";

export type ScratchOutcome = {
  tokenId: bigint;
  rarity: number;
};

export function useWatchScratched(
  onScratch: (outcome: ScratchOutcome) => void,
  listening: boolean
) {
  const { address } = useAccount();
  const cb = useRef(onScratch);

  useEffect(() => {
    cb.current = onScratch;
  }, [onScratch]);

  useWatchContractEvent({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    eventName: "Scratched",
    enabled:
      isContractConfigured &&
      !!address &&
      listening,
    onLogs(logs) {
      const mine = address?.toLowerCase();
      for (const log of logs) {
        const p = log.args?.player as Address | undefined;
        if (!p || p.toLowerCase() !== mine) continue;
        const tokenId = log.args?.tokenId as bigint | undefined;
        const rarity = log.args?.rarity;
        if (tokenId === undefined || rarity === undefined) continue;
        cb.current({
          tokenId,
          rarity: Number(rarity),
        });
      }
    },
  });
}
