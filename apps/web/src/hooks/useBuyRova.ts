"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseEther, type Address, type Hex } from "viem";
import {
  useAccount,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { configuredChain } from "@/constants/chains";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";
import { CELO_BUY_PACK, ROVA_PER_CELO } from "@/constants/rova";
import { useRovaBalance } from "@/hooks/useRovaBalance";

function rovaTreasury(userAddress: Address): Address {
  return isContractConfigured ? LOOT_SCRATCH_ADDRESS : userAddress;
}

export function useBuyRova() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { credit } = useRovaBalance();
  const { sendTransactionAsync, isPending, error } = useSendTransaction();
  const [hash, setHash] = useState<Hex | undefined>();
  const creditedHash = useRef<Hex | undefined>(undefined);

  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: configuredChain.id,
    query: { enabled: !!hash },
  });

  useEffect(() => {
    if (
      !receipt.isSuccess ||
      !hash ||
      creditedHash.current === hash
    )
      return;
    creditedHash.current = hash;
    credit(ROVA_PER_CELO);
    setHash(undefined);
  }, [receipt.isSuccess, hash, credit]);

  const buyPack = useCallback(async (): Promise<Hex> => {
    if (!isConnected || !address)
      throw new Error("Connect wallet to buy ROVA.");

    if (chainId !== configuredChain.id)
      throw new Error(`Switch to ${configuredChain.name}.`);

    const h = await sendTransactionAsync({
      to: rovaTreasury(address),
      value: parseEther(CELO_BUY_PACK),
    });
    setHash(h);
    return h;
  }, [address, chainId, isConnected, sendTransactionAsync]);

  const buyPackDemo = useCallback(() => {
    credit(ROVA_PER_CELO);
  }, [credit]);

  const isBuying =
    isPending || (!!hash && (receipt.isLoading || receipt.isFetching));

  return {
    buyPack,
    buyPackDemo,
    isBuying,
    error,
    packCelo: CELO_BUY_PACK,
    packRova: ROVA_PER_CELO,
  };
}
