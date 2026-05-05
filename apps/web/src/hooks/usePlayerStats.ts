"use client";

import { zeroAddress } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";

export function usePlayerStats() {
  const { address } = useAccount();
  const enabled = isContractConfigured;
  const player = address ?? zeroAddress;

  const balance = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "balanceOf",
    args: [player],
    query: { enabled: enabled && !!address },
  });

  const scratchesDay = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "scratchesToday",
    args: [player],
    query: { enabled: enabled && !!address },
  });

  const streak = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "streakDays",
    args: [player],
    query: { enabled: enabled && !!address },
  });

  const totalScratches = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "totalScratches",
    query: { enabled },
  });

  const totalNfts = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "totalSupply",
    query: { enabled },
  });

  const totalPlayers = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "totalPlayers",
    query: { enabled },
  });

  const loading =
    balance.isLoading ||
    scratchesDay.isLoading ||
    streak.isLoading ||
    totalScratches.isLoading ||
    totalNfts.isLoading ||
    totalPlayers.isLoading;

  return {
    nftCount: (balance.data as bigint | undefined) ?? 0n,
    scratchesToday: (scratchesDay.data as bigint | undefined) ?? 0n,
    streak: (streak.data as bigint | undefined) ?? 0n,
    totalScratches: (totalScratches.data as bigint | undefined) ?? 0n,
    totalNfts: (totalNfts.data as bigint | undefined) ?? 0n,
    totalPlayers: (totalPlayers.data as bigint | undefined) ?? 0n,
    isLoading: enabled ? loading : false,
  };
}
