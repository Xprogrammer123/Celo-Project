"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";

export type LeaderRow = {
  address: Address;
  legendary: number;
  rank: number;
};

const REFRESH_MS = 30_000;

export function useLeaderboard() {
  const publicClient = usePublicClient();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [scratchedMap, setScratchedMap] = useState<Record<string, number>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!publicClient || !isContractConfigured) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const latest = await publicClient.getBlockNumber();
      const from = latest > 50_000n ? latest - 50_000n : 0n;
      const legendLogs = await publicClient.getContractEvents({
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        eventName: "LegendaryMinted",
        fromBlock: from,
        toBlock: "latest",
      });
      const scratchLogs = await publicClient.getContractEvents({
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        eventName: "Scratched",
        fromBlock: from,
        toBlock: "latest",
      });

      const legendBy: Record<string, number> = {};
      for (const log of legendLogs) {
        const p = log.args.player as Address;
        legendBy[p] = (legendBy[p] ?? 0) + 1;
      }

      const scratchBy: Record<string, number> = {};
      for (const log of scratchLogs) {
        const p = log.args.player as Address;
        scratchBy[p] = (scratchBy[p] ?? 0) + 1;
      }

      const sorted = Object.entries(legendBy)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([addr, legendary], i) => ({
          address: addr as Address,
          legendary,
          rank: i + 1,
        }));

      setRows(sorted);
      setScratchedMap(scratchBy);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return {
    rows,
    totalScratchesFor: (a: Address) => scratchedMap[a.toLowerCase()] ?? 0,
    reload: load,
    isLoading,
  };
}
