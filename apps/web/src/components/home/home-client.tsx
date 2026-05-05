"use client";

import Link from "next/link";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { WinTicker } from "@/components/game/win-ticker";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroDialog,
  RetroDialogClose,
  RetroDialogContent,
  RetroDialogDescription,
  RetroDialogTitle,
  RetroDialogTrigger,
} from "@/components/retroui/dialog";

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-2 border-black bg-white px-4 py-3 text-center shadow-[var(--shadow-sm)]">
      <div className="font-head text-2xl font-black tabular-nums">{value}</div>
      <div className="font-sans text-xs font-bold uppercase text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

export function HomeClient() {
  const {
    totalScratches,
    totalNfts,
    totalPlayers,
    isLoading,
  } = usePlayerStats();

  const fmt = (n: bigint) =>
    n >= 100000n ? `${(Number(n) / 1000).toFixed(0)}k` : n.toString();

  return (
    <main>
      <section className="relative flex min-h-[calc(100vh-8rem)] flex-col justify-center px-4 py-12">
        <WinTicker className="absolute left-0 right-0 top-0" />

        <div className="mx-auto max-w-4xl text-center">
          <h1
            className="font-head text-5xl font-black uppercase leading-none tracking-tighter text-black md:text-7xl lg:text-8xl"
            style={{ transform: "rotate(-2deg)" }}
          >
            LOOT SCRATCH
          </h1>
          <p className="font-sans mt-6 text-lg font-medium text-muted-foreground md:text-xl">
            Pay. Scratch. Win an NFT. On-chain. Provably fair.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link href="/play">
              <RetroButton
                size="lg"
                className="shadow-[var(--shadow-xl)] text-lg"
              >
                SCRATCH NOW
              </RetroButton>
            </Link>

            <RetroDialog>
              <RetroDialogTrigger asChild>
                <button
                  type="button"
                  className="font-sans text-sm font-bold uppercase underline decoration-2 underline-offset-4"
                >
                  How to Play
                </button>
              </RetroDialogTrigger>
              <RetroDialogContent>
                <RetroDialogTitle>HOW TO PLAY</RetroDialogTitle>
                <RetroDialogDescription className="font-sans space-y-3 text-left text-base text-foreground">
                  <p>
                    <strong>1.</strong> Connect on Base Sepolia and hit SCRATCH.
                    Chainlink VRF rolls your rarity — no house tricks.
                  </p>
                  <p>
                    <strong>2.</strong> Scratch the grid while the oracle works.
                    Rare or better? Confetti. Common? Shake it off.
                  </p>
                  <p>
                    <strong>3.</strong> Flex your NFT in the gallery. Legendary
                    hits hit the ticker. Tag us when you moon.
                  </p>
                </RetroDialogDescription>
                <RetroDialogClose type="button">LET&apos;S GO</RetroDialogClose>
              </RetroDialogContent>
            </RetroDialog>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-3 md:gap-4">
            <StatBlock
              label="Scratches"
              value={isLoading ? "…" : fmt(totalScratches)}
            />
            <StatBlock
              label="NFTs minted"
              value={isLoading ? "…" : fmt(totalNfts)}
            />
            <StatBlock
              label="Players"
              value={isLoading ? "…" : fmt(totalPlayers)}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
