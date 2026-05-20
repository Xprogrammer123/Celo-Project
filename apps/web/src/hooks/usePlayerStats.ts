"use client";

import { useCallback } from "react";
import { zeroAddress } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";

export function usePlayerStats() {
  const { address } = useAccount();
  const enabled = isContractConfigured;
  const player  = address ?? zeroAddress;

  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "balanceOf",
        args: [player],
      },
      {
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "scratchesToday",
        args: [player],
      },
      {
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "streakDays",
        args: [player],
      },
      {
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "totalScratches",
      },
      {
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "totalSupply",
      },
      {
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "totalPlayers",
      },
    ],
    query: { enabled },
  });

  const [balance, scratchDay, streak, totalScratches, totalNfts, totalPlayers] =
    data ?? [];

  return {
    nftCount:       (balance?.result       as bigint | undefined) ?? 0n,
    scratchesToday: (scratchDay?.result     as bigint | undefined) ?? 0n,
    streak:         (streak?.result         as bigint | undefined) ?? 0n,
    totalScratches: (totalScratches?.result as bigint | undefined) ?? 0n,
    totalNfts:      (totalNfts?.result      as bigint | undefined) ?? 0n,
    totalPlayers:   (totalPlayers?.result   as bigint | undefined) ?? 0n,
    isLoading:      enabled ? isLoading : false,
    refetch,
  };
}