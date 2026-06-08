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
  ROVA_PACKS,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
  type RovaPack,
} from "@/constants/rova";
import { rovaCreditsForCelo } from "@/lib/rova-math";
import { friendlyWalletError } from "@/lib/wallet-errors";
import { useRovaBalance } from "@/hooks/useRovaBalance";

function rovaTreasury(userAddress: Address): Address {
  return isContractConfigured ? LOOT_SCRATCH_ADDRESS : userAddress;
}

export function useBuyRova() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { credit } = useRovaBalance();
  const { sendTransactionAsync, isPending, error: wagmiError, reset } =
    useSendTransaction();
  const [hash, setHash] = useState<Hex | undefined>();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
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
    async (celoAmount: string, rovaCredit?: number): Promise<Hex> => {
      setStatusMessage(null);
      reset?.();

      if (!isConnected || !address) {
        const msg = "Connect your wallet first.";
        setStatusMessage(msg);
        throw new Error(msg);
      }

      if (chainId !== configuredChain.id) {
        const msg = `Switch to ${configuredChain.name}.`;
        setStatusMessage(msg);
        throw new Error(msg);
      }

      const value = parseEther(celoAmount);
      if (celoBalance && value > celoBalance.value) {
        const msg = "Not enough CELO for this pack.";
        setStatusMessage(msg);
        throw new Error(msg);
      }

      pendingRovaCredit.current =
        rovaCredit ?? rovaCreditsForCelo(celoAmount);

      try {
        const h = await sendTransactionAsync({
          to: rovaTreasury(address),
          value,
        });
        setHash(h);
        return h;
      } catch (e) {
        setStatusMessage(friendlyWalletError(e));
        throw e;
      }
    },
    [
      address,
      chainId,
      isConnected,
      celoBalance,
      sendTransactionAsync,
      reset,
    ]
  );

  const buyRovaPack = useCallback(
    async (pack: RovaPack): Promise<Hex | undefined> => {
      try {
        return await buyWithCelo(pack.celo, pack.rova);
      } catch {
        return undefined;
      }
    },
    [buyWithCelo]
  );

  const buyPack = useCallback(async (): Promise<Hex> => {
    return buyRovaPack(ROVA_PACKS[0]);
  }, [buyRovaPack]);

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

  const canAffordCelo = useCallback(
    (celo: string) => celoWei >= parseEther(celo),
    [celoWei]
  );

  const isBuying =
    isPending || (!!hash && (receipt.isLoading || receipt.isFetching));

  const status =
    statusMessage ??
    (wagmiError ? friendlyWalletError(wagmiError) : null);

  return {
    buyRovaPack,
    buyPack,
    buyOneGame,
    buyMaxAffordable,
    buyWithCelo,
    buyPackDemo,
    isBuying,
    status,
    canAffordCelo,
    canBuyOneGame,
    canBuyPack,
    maxRovaFromWallet,
    packCelo: CELO_BUY_PACK,
    packRova: ROVA_PER_CELO,
    gameCelo: CELO_PER_GAME,
    gameRova: ROVA_PER_GAME,
  };
}
