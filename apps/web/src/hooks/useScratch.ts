"use client";

import { useCallback, useState } from "react";
import { zeroAddress, type Address, type Hex } from "viem";
import { useChainId, useReadContract, useWriteContract } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";
import { configuredChain } from "@/constants/chains";

export function useScratch() {
  const chainId = useChainId();
  const { writeContractAsync, isPending, error } = useWriteContract();
  const [sessionSpent, setSessionSpent] = useState(0n);

  const { data: mintFee } = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "mintFee",
    query: { enabled: isContractConfigured },
  });

  const fee = (mintFee as bigint | undefined) ?? 0n;

  const scratch = useCallback(
    async (referrer: Address = zeroAddress): Promise<Hex> => {
      if (!isContractConfigured)
        throw new Error("Contract not configured.");
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
    isPending,
    error,
    sessionSpentWei: sessionSpent,
  };
}
