"use client";

import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";

export function useStreak() {
  const { address } = useAccount();
  const { data, isLoading } = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "streakDays",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) && isContractConfigured },
  });

  return {
    streakDays: (data as bigint | undefined) ?? 0n,
    isLoading,
  };
}
