"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEther, parseEther, type Address, type Hex } from "viem";
import {
  useAccount,
  useBalance,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";
import { configuredChain } from "@/constants/chains";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";
import {
  CELO_BUY_PACK,
  CELO_PER_GAME,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
} from "@/constants/rova";
import { rovaCreditsForCelo } from "@/lib/rova-math";
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
  const pendingRovaCredit = useRef(ROVA_PER_CELO);

  const { data: celoBalance } = useBalance({
    address: isConnected ? address : undefined,
    chainId: configuredChain.id,
  });

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
    credit(pendingRovaCredit.current);
    setHash(undefined);
  }, [receipt.isSuccess, hash, credit]);

  const buyWithCelo = useCallback(
    async (celoAmount: string): Promise<Hex> => {
      if (!isConnected || !address)
        throw new Error("Connect wallet to buy ROVA.");

      if (chainId !== configuredChain.id)
        throw new Error(`Switch to ${configuredChain.name}.`);

      const value = parseEther(celoAmount);
      if (celoBalance && value > celoBalance.value)
        throw new Error("Not enough CELO in your wallet.");

      pendingRovaCredit.current = rovaCreditsForCelo(celoAmount);
      const h = await sendTransactionAsync({
        to: rovaTreasury(address),
        value,
      });
      setHash(h);
      return h;
    },
    [address, chainId, isConnected, celoBalance, sendTransactionAsync]
  );

  const buyPack = useCallback(async (): Promise<Hex> => {
    pendingRovaCredit.current = ROVA_PER_CELO;
    return buyWithCelo(CELO_BUY_PACK);
  }, [buyWithCelo]);

  const buyOneGame = useCallback(async (): Promise<Hex> => {
    pendingRovaCredit.current = ROVA_PER_GAME;
    return buyWithCelo(CELO_PER_GAME);
  }, [buyWithCelo]);

  const buyMaxAffordable = useCallback(async (): Promise<Hex> => {
    if (!celoBalance || celoBalance.value === 0n)
      throw new Error("No CELO balance.");
    const amount = formatEther(celoBalance.value);
    pendingRovaCredit.current = rovaCreditsForCelo(amount);
    return buyWithCelo(amount);
  }, [buyWithCelo, celoBalance]);

  const buyPackDemo = useCallback(() => {
    credit(ROVA_PER_CELO);
  }, [credit]);

  const celoWei = celoBalance?.value ?? 0n;
  const canBuyOneGame = celoWei >= parseEther(CELO_PER_GAME);
  const canBuyPack = celoWei >= parseEther(CELO_BUY_PACK);
  const maxRovaFromWallet = rovaCreditsForCelo(
    celoWei > 0n ? formatEther(celoWei) : "0"
  );

  const isBuying =
    isPending || (!!hash && (receipt.isLoading || receipt.isFetching));

  return {
    buyPack,
    buyOneGame,
    buyMaxAffordable,
    buyWithCelo,
    buyPackDemo,
    isBuying,
    error,
    canBuyOneGame,
    canBuyPack,
    maxRovaFromWallet,
    packCelo: CELO_BUY_PACK,
    packRova: ROVA_PER_CELO,
    gameCelo: CELO_PER_GAME,
    gameRova: ROVA_PER_GAME,
  };
}
