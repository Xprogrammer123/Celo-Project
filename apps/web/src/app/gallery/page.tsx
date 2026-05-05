"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { lootScratchAbi } from "@/contracts";
import { LOOT_SCRATCH_ADDRESS, isContractConfigured } from "@/constants/contract";
import { rarityLabel } from "@/constants/rarity";
import { imageFromTokenURI } from "@/lib/nft-metadata";
import { RetroBadge } from "@/components/retroui/badge";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroCard,
  RetroCardContent,
  RetroCardHeader,
  RetroCardTitle,
} from "@/components/retroui/card";

const badgeFor = [ "common", "rare", "epic", "legendary" ] as const;

export default function GalleryPage() {
  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: LOOT_SCRATCH_ADDRESS,
    abi: lootScratchAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isContractConfigured && !!address },
  });

  const n = Number(balance ?? 0);

  const indexContracts = useMemo(() => {
    if (!address || !isContractConfigured || n === 0) return [];
    return Array.from({ length: n }, (_, i) => ({
      address: LOOT_SCRATCH_ADDRESS,
      abi: lootScratchAbi,
      functionName: "tokenOfOwnerByIndex" as const,
      args: [address, BigInt(i)] as const,
    }));
  }, [address, n]);

  const tokenRows = useReadContracts({
    contracts: indexContracts,
    query: { enabled: indexContracts.length > 0 },
  });

  const tokenIds = useMemo(() => {
    return (tokenRows.data ?? [])
      .map((r) => r.result as bigint | undefined)
      .filter((x): x is bigint => x !== undefined && x !== null);
  }, [tokenRows.data]);

  const metaContracts = useMemo(() => {
    return tokenIds.map((id) => ({
      address: LOOT_SCRATCH_ADDRESS,
      abi: lootScratchAbi,
      functionName: "tokenURI" as const,
      args: [id] as const,
    }));
  }, [tokenIds]);

  const rarityContracts = useMemo(() => {
    return tokenIds.map((id) => ({
      address: LOOT_SCRATCH_ADDRESS,
      abi: lootScratchAbi,
      functionName: "tokenRarity" as const,
      args: [id] as const,
    }));
  }, [tokenIds]);

  const uris = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0 },
  });

  const rarities = useReadContracts({
    contracts: rarityContracts,
    query: { enabled: rarityContracts.length > 0 },
  });

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-head text-3xl font-black uppercase">
          CONNECT TO FLEX YOUR LOOT
        </p>
      </div>
    );
  }

  if (!isContractConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center font-sans">
        Set <code className="font-mono">NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS</code>{" "}
        after deploy.
      </div>
    );
  }

  if (n === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="font-head text-4xl font-black uppercase">
          NO LOOT YET
        </p>
        <p className="font-sans mt-4 text-muted-foreground">
          YOUR WALLET IS EMPTY. GET SCRATCHING.
        </p>
        <Link href="/play" className="mt-8 inline-block">
          <RetroButton size="lg">GO SCRATCH</RetroButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-head mb-8 text-3xl font-black uppercase md:text-4xl">
        YOUR GALLERY
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tokenIds.map((id, i) => {
          const uri = uris.data?.[i]?.result as string | undefined;
          const ra = Number(rarities.data?.[i]?.result ?? 0);
          const img = uri ? imageFromTokenURI(uri) : null;
          return (
            <RetroCard key={id.toString()} className="overflow-hidden">
              <div className="relative aspect-square border-b-2 border-black bg-muted">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data: URIs from chain
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-sans text-xs">
                    LOADING ART…
                  </div>
                )}
              </div>
              <RetroCardHeader className="py-3">
                <RetroCardTitle className="text-sm">
                  #{id.toString()}
                </RetroCardTitle>
              </RetroCardHeader>
              <RetroCardContent className="space-y-2 pb-4 font-sans text-xs">
                <RetroBadge variant={badgeFor[ra] ?? "muted"}>
                  {rarityLabel(ra)}
                </RetroBadge>
                <p className="text-muted-foreground">
                  On-chain SVG • Loot Scratch collection
                </p>
              </RetroCardContent>
            </RetroCard>
          );
        })}
      </div>
    </div>
  );
}
