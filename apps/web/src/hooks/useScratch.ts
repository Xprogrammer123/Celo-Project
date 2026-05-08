"use client";

import { useCallback, useState } from "react";
import type { Address, Hex } from "viem";
import { useAccount, useReadContract, useWriteContract, useChainId } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";
import { configuredChain } from "@/constants/chains";

export function useScratch() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: hash, writeContractAsync, isPending, error } = useWriteContract();
  const [sessionSpent, setSessionSpent] = useState(0n);

  const { data: mintFee } = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "mintFee",
    query: { enabled: isContractConfigured },
  });

  const fee = (mintFee as bigint | undefined) ?? 0n;

  const scratch = useCallback(
    async (referrer: Address) => {
      if (!isContractConfigured)
        throw new Error("Set NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS first.");
      if (chainId !== configuredChain.id)
        throw new Error(`Switch to ${configuredChain.name}.`);
      const h = await writeContractAsync({
        address: LOOT_SCRATCH_ADDRESS,
        abi: lootScratchAbi,
        functionName: "scratch",
        args: [referrer],
        value: fee,
      });
      setSessionSpent((s) => s + fee);
      return h;
    },
    [chainId, fee, writeContractAsync]
  );

  return {
    scratch,
    mintFee: fee,
    hash: hash as Hex | undefined,
    isPending,
    error,
    sessionSpentWei: sessionSpent,
  };
}