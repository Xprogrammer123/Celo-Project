"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  decodeEventLog,
  parseEventLogs,
  formatEther,
  isAddress,
  zeroAddress,
  type Address,
  type Hex,
} from "viem";
import {
  useAccount,
  useChainId,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { celo } from "wagmi/chains";
import { rarityLabel } from "@/constants/rarity";
import { isContractConfigured } from "@/constants/contract";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useScratch } from "@/hooks/useScratch";
import {
  useWatchScratched,
  type ScratchOutcome,
} from "@/hooks/useWatchScratchEvents";
import { RarityOddsPanel } from "@/components/game/rarity-panel";
import { RetroBadge } from "@/components/retroui/badge";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroCard,
  RetroCardContent,
  RetroCardHeader,
  RetroCardTitle,
} from "@/components/retroui/card";
import {
  RetroDialog,
  RetroDialogClose,
  RetroDialogContent,
  RetroDialogDescription,
  RetroDialogTitle,
} from "@/components/retroui/dialog";
import { RetroInput } from "@/components/retroui/input";
import { RetroProgress } from "@/components/retroui/progress";

const CELL = 9;

function tierCellClass(rarity: number | null, revealed: boolean) {
  if (!revealed) return "bg-[#2a2a2a]";
  if (rarity === null) return "bg-[#2a2a2a]";
  if (rarity === 0) return "bg-neutral-300 border-black";
  if (rarity === 1) return "bg-primary border-black";
  if (rarity === 2) return "bg-purple-700 border-black";
  return "bg-black border-[#ffd700]";
}

function Flame() {
  return (
    <span
      className="inline-block h-4 w-3 bg-orange-500 shadow-[2px_2px_0_0_black]"
      style={{
        clipPath: "polygon(50% 0%, 100% 65%, 75% 100%, 50% 85%, 25% 100%, 0% 65%)",
      }}
      title="Streak"
    />
  );
}

export function ScratchGame() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongChain = isConnected && chainId !== celo.id;

  const {
    nftCount,
    scratchesToday,
    streak,
    isLoading: statsLoading,
  } = usePlayerStats();

  const { scratch, mintFee, isPending, error, sessionSpentWei } = useScratch();

  const [referrerIn, setReferrerIn] = useState("");
  const [hash, setHash] = useState<Hex | undefined>();
  const [listen, setListen] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>(() =>
    Array.from({ length: CELL }, () => false)
  );
  const [resultRarity, setResultRarity] = useState<number | null>(null);
  const [phase, setPhase] = useState<
    "idle" | "confirm" | "revealing" | "done"
  >("idle");
  const [shake, setShake] = useState(false);
  const [flashWin, setFlashWin] = useState(false);
  const [winOpen, setWinOpen] = useState(false);
  const [lossOpen, setLossOpen] = useState(false);

  const processedHash = useRef<Hex | undefined>();

  const onOutcome = useCallback((o: ScratchOutcome) => {
    setListen(false);
    setResultRarity(o.rarity);
    setPhase("done");
    setRevealed(Array.from({ length: CELL }, () => false));

    let i = 0;
    const id = window.setInterval(() => {
      setRevealed((prev) => {
        const n = [...prev];
        if (i < CELL) n[i] = true;
        return n;
      });
      i += 1;
      if (i >= CELL) window.clearInterval(id);
    }, 120);

    const isWin = o.rarity >= 1;
    if (isWin) {
      setFlashWin(true);
      void confetti({ particleCount: 140, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => setFlashWin(false), 1100);
      setTimeout(() => setWinOpen(true), 800);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setLossOpen(true), 500);
    }
  }, []);

  useWatchScratched(
    useCallback(
      (outcome: ScratchOutcome) => {
        onOutcome(outcome);
      },
      [onOutcome]
    ),
    listen
  );

  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: celo.id,
    query: { enabled: !!hash },
  });

  useEffect(() => {
    if (
      receipt.isSuccess &&
      receipt.data &&
      hash &&
      processedHash.current !== hash
    ) {
      processedHash.current = hash;
      setPhase("revealing");

      // Try to find the Scratched event in the receipt logs
      try {
        const logs = parseEventLogs({
          abi: lootScratchAbi,
          logs: receipt.data.logs,
          eventName: "Scratched",
        });

        const myLog = logs.find(
          (l) => l.args.player?.toLowerCase() === address?.toLowerCase()
        );

        if (myLog) {
          // Show "REVEALING..." for 1.5s then show the result
          setTimeout(() => {
            onOutcome({
              tokenId: myLog.args.tokenId as bigint,
              rarity: Number(myLog.args.rarity),
            });
          }, 1500);
          return;
        }
      } catch (err) {
        console.error("Failed to parse scratch logs", err);
      }

      // Fallback to event listener if not found in logs
      setListen(true);
    }
  }, [receipt.isSuccess, receipt.data, hash, address, onOutcome]);

  useEffect(() => {
    if (receipt.isError) {
      setPhase("idle");
      setHash(undefined);
    }
  }, [receipt.isError]);

  const scratchPct = useMemo(() => {
    const n = revealed.filter(Boolean).length;
    return Math.round((n / CELL) * 100);
  }, [revealed]);

  const revealAllCells = () => {
    setRevealed(Array.from({ length: CELL }, () => true));
  };

  const resetRound = () => {
    setPhase("idle");
    setHash(undefined);
    setListen(false);
    setResultRarity(null);
    setRevealed(Array.from({ length: CELL }, () => false));
    setWinOpen(false);
    setLossOpen(false);
  };

  const runScratch = async () => {
    if (!isContractConfigured) return;
    let ref: Address = zeroAddress;
    const t = referrerIn.trim();
    if (t) {
      if (!isAddress(t)) {
        alert("That referrer address looks fake. Try again.");
        return;
      }
      ref = t;
    }
    setPhase("confirm");
    try {
      const h = await scratch(ref);
      setHash(h);
    } catch {
      setPhase("idle");
    }
  };

  const shareUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const tweet =
    resultRarity !== null
      ? `Just scratched on Loot Scratch — got ${rarityLabel(resultRarity)}. Try your luck: ${shareUrl}`
      : "";

  if (!isConnected || wrongChain) {
    return (
      <RetroCard className="shadow-[var(--shadow-xl)]">
        <RetroCardHeader>
          <RetroCardTitle className="text-center">CONNECT WALLET</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent className="space-y-4 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            Celo Mainnet only.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </RetroCardContent>
      </RetroCard>
    );
  }

  return (
    <div className="space-y-6">
      <RetroCard
        className={`border-[3px] border-black bg-primary shadow-[var(--shadow-xl)] ${shake ? "animate-shake border-destructive" : ""} ${flashWin ? "animate-flash-win" : ""}`}
      >
        <RetroCardHeader className="border-b-2 border-black bg-primary">
          <p className="font-head text-center text-lg font-black uppercase">
            SCRATCH CARD
          </p>
        </RetroCardHeader>
        <RetroCardContent className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {revealed.map((r, idx) => (
              <button
                key={idx}
                type="button"
                className={`relative flex min-h-[60px] min-w-[60px] items-center justify-center border-2 border-black shadow-[var(--shadow-sm)] transition-transform duration-150 ${tierCellClass(resultRarity, r)} ${r ? "scale-100 opacity-100" : "opacity-100"} active:scale-95`}
                style={{
                  backgroundImage: !r
                    ? "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,0,0,0.25) 4px, rgba(0,0,0,0.25) 8px)"
                    : undefined,
                }}
                onClick={() => {
                  if (phase !== "done" || resultRarity === null) return;
                  setRevealed((prev) => {
                    const n = [...prev];
                    if (!n[idx]) n[idx] = true;
                    return n;
                  });
                }}
              >
                {r && resultRarity !== null && (
                  <span className="font-head text-[10px] font-black leading-none text-black sm:text-xs">
                    {rarityLabel(resultRarity).slice(0, 3)}
                  </span>
                )}
              </button>
            ))}
          </div>

          <RetroProgress value={scratchPct} />

          <p className="font-sans text-center text-xs font-bold text-muted-foreground">
            {revealed.filter(Boolean).length} / {CELL} scratched
          </p>

          <div className="flex flex-wrap gap-2">
            <RetroButton
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={
                phase !== "done" ||
                resultRarity === null ||
                revealed.every(Boolean)
              }
              onClick={revealAllCells}
            >
              SCRATCH ALL
            </RetroButton>
            <RetroButton
              type="button"
              variant="outline"
              className="flex-1"
              disabled={phase !== "idle"}
              onClick={resetRound}
            >
              RESET
            </RetroButton>
          </div>

          <RetroInput
            placeholder="Referrer wallet (optional, 5% to them)"
            value={referrerIn}
            onChange={(e) => setReferrerIn(e.target.value)}
            disabled={phase !== "idle" && phase !== "done"}
            className="font-mono text-xs"
          />

          <RetroButton
            type="button"
            className="w-full shadow-[var(--shadow-md)]"
            disabled={
              !isContractConfigured ||
              isPending ||
              phase === "confirm" ||
              phase === "revealing"
            }
            onClick={() => void runScratch().catch(() => {})}
          >
            {phase === "confirm"
              ? "CONFIRMING…"
              : phase === "revealing"
                ? "REVEALING…"
                : isPending
                  ? "CHECK WALLET…"
                  : "SCRATCH (PAY)"}
          </RetroButton>

          <p className="font-sans text-center text-sm text-muted-foreground">
            Cost:{" "}
            {mintFee > 0n
              ? `${formatEther(mintFee)} CELO`
              : "…"}{" "}
            per scratch
          </p>
          {sessionSpentWei > 0n && (
            <p className="font-sans text-center text-[11px] text-muted-foreground">
              Session spend: {formatEther(sessionSpentWei)} CELO
            </p>
          )}
          {error && (
            <p className="font-sans text-center text-sm font-bold text-destructive">
              Transaction failed. The blockchain said no. Try again.
            </p>
          )}
          {!isContractConfigured && (
            <p className="font-sans text-center text-sm font-bold">
              Deploy the contract and set NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS.
            </p>
          )}
        </RetroCardContent>
      </RetroCard>

      <RetroDialog open={winOpen} onOpenChange={setWinOpen}>
        <RetroDialogContent>
          <RetroDialogTitle>
            {resultRarity === 3
              ? "YOU WON A LEGENDARY. SCREENSHOT THIS."
              : "YOU WON. SCREENSHOT THIS."}
          </RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground">
            Rarity:{" "}
            <strong>
              {resultRarity !== null ? rarityLabel(resultRarity) : ""}
            </strong>
            . Provably fair. Don&apos;t forget to flex.
          </RetroDialogDescription>
          <RetroButton
            type="button"
            className="mt-2 w-full"
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
                "_blank"
              )
            }
          >
            SHARE ON X
          </RetroButton>
          <RetroDialogClose type="button" className="w-full">
            CLOSE
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog open={lossOpen} onOpenChange={setLossOpen}>
        <RetroDialogContent>
          <RetroDialogTitle>NOT THIS TIME. ONE MORE?</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground">
            Common doesn&apos;t mean ordinary — it means you paid tuition to the
            chain. Hit scratch again.
          </RetroDialogDescription>
          <RetroDialogClose type="button" className="w-full">
            AGAIN
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      <RetroCard>
        <RetroCardHeader>
          <RetroCardTitle className="text-base">RUN STATS</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent className="font-sans space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your NFTs</span>
            <span className="font-bold tabular-nums">
              {statsLoading ? "…" : nftCount.toString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Scratches today (UTC)</span>
            <span className="flex items-center gap-1 font-bold tabular-nums">
              {streak >= 2n && <Flame />}
              {statsLoading ? "…" : scratchesToday.toString()} / 5
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Streak days</span>
            <span className="font-bold tabular-nums">
              {statsLoading ? "…" : streak.toString()}
            </span>
          </div>
        </RetroCardContent>
      </RetroCard>

      <RetroCard>
        <RetroCardHeader>
          <RetroCardTitle className="text-base">RARITY ODDS</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <RarityOddsPanel />
        </RetroCardContent>
      </RetroCard>

      <RetroButton
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Just scratched on Loot Scratch — got ${resultRarity !== null ? rarityLabel(resultRarity) : "???"} Try: ${shareUrl}`
            )}`,
            "_blank"
          )
        }
      >
        SHARE RUN
      </RetroButton>
    </div>
  );
}
