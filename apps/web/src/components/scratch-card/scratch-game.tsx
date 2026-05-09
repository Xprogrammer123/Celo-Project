"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatEther,
  isAddress,
  parseEventLogs,
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
import { configuredChain } from "@/constants/chains";
import { lootScratchAbi } from "@/contracts";
import { rarityLabel } from "@/constants/rarity";
import { isContractConfigured } from "@/constants/contract";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useScratch } from "@/hooks/useScratch";
import { RarityOddsPanel } from "@/components/game/rarity-panel";
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

type Phase = "idle" | "confirm" | "revealing" | "done";

export type ScratchOutcome = {
  tokenId: bigint;
  rarity: number;
};

/* ─── helpers ─────────────────────────────────────────── */

function rarityBg(rarity: number | null) {
  if (rarity === null) return "#2a2a2a";
  if (rarity === 0) return "#d4d4d4";
  if (rarity === 1) return "#ffdb33";
  if (rarity === 2) return "#7e22ce";
  return "#000000";
}

function rarityText(rarity: number | null) {
  if (rarity === null) return "#fff";
  if (rarity === 2) return "#fff";
  if (rarity === 3) return "#ffd700";
  return "#000";
}

function ScratchCell({
  revealed,
  rarity,
  onClick,
}: {
  revealed: boolean;
  rarity: number | null;
  onClick: () => void;
}) {
  return (
    <div
      className="relative cursor-pointer"
      style={{ perspective: "600px", minHeight: 70, minWidth: 70 }}
      onClick={onClick}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 70,
          transformStyle: "preserve-3d",
          transition: "transform 0.45s cubic-bezier(.4,0,.2,1)",
          transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT — scratchy dark tile */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "#2a2a2a",
            border: "2px solid #000",
            backgroundImage:
              "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,.07) 4px,rgba(255,255,255,.07) 8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 20, opacity: 0.3 }}>?</span>
        </div>

        {/* BACK — rarity reveal */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: rarityBg(rarity),
            border: rarity === 3 ? "2px solid #ffd700" : "2px solid #000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: rarity === 3 ? 16 : 18, color: rarityText(rarity) }}>
            {rarity === 3 ? "\u2605" : rarity === 2 ? "\u25c6" : rarity === 1 ? "\u2726" : "\u00b7"}
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: "bold",
              color: rarityText(rarity),
              letterSpacing: 1,
            }}
          >
            {rarity !== null ? ["COM", "RARE", "EPIC", "LEG"][rarity] : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function Flame() {
  return (
    <span
      className="inline-block h-4 w-3 bg-orange-500 shadow-[2px_2px_0_0_black]"
      style={{
        clipPath:
          "polygon(50% 0%, 100% 65%, 75% 100%, 50% 85%, 25% 100%, 0% 65%)",
      }}
      title="Streak active"
    />
  );
}

/* ─── main component ──────────────────────────────────── */

export function ScratchGame() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongChain = isConnected && chainId !== configuredChain.id;

  const { nftCount, scratchesToday, streak, isLoading: statsLoading, refetch: refetchStats } =
    usePlayerStats();

  const { scratch, mintFee, isPending, error, sessionSpentWei } = useScratch();

  /* form state */
  const [referrerIn, setReferrerIn] = useState("");

  /* tx tracking */
  const [hash, setHash] = useState<Hex | undefined>();
  const processedHash = useRef<Hex | undefined>(undefined);

  /* game state */
  const [phase, setPhase]               = useState<Phase>("idle");
  const [resultRarity, setResultRarity] = useState<number | null>(null);
  const [revealed, setRevealed]         = useState<boolean[]>(() =>
    Array(CELL).fill(false)
  );

  /* animation flags */
  const [shake,     setShake]     = useState(false);
  const [flashWin,  setFlashWin]  = useState(false);
  const [winOpen,   setWinOpen]   = useState(false);
  const [lossOpen,  setLossOpen]  = useState(false);

  /* ── receipt watcher ─────────────────────────────────── */
  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: configuredChain.id,
    query: { enabled: !!hash },
  });

  /* ── handle outcome ──────────────────────────────────── */
  const onOutcome = useCallback(
    (outcome: ScratchOutcome) => {
      setResultRarity(outcome.rarity);
      setPhase("done");

      // reveal cells one by one
      setRevealed(Array(CELL).fill(false));
      let i = 0;
      const id = window.setInterval(() => {
        setRevealed((prev) => {
          const next = [...prev];
          if (i < CELL) next[i] = true;
          return next;
        });
        i += 1;
        if (i >= CELL) window.clearInterval(id);
      }, 120);

      // win / loss feedback
      const isWin = outcome.rarity >= 1;
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

      // refresh on-chain stats
      void refetchStats();
    },
    [refetchStats]
  );

  /* ── parse receipt once confirmed ────────────────────── */
  useEffect(() => {
    if (
      !receipt.isSuccess ||
      !receipt.data ||
      !hash ||
      processedHash.current === hash
    )
      return;

    processedHash.current = hash;
    setPhase("revealing");

    try {
      // The Scratched event is emitted IN the same tx for the no-VRF contract
      const logs = parseEventLogs({
        abi: lootScratchAbi,
        logs: receipt.data.logs,
        eventName: "Scratched",
      });

      const mine = logs.find(
        (l) => l.args.player?.toLowerCase() === address?.toLowerCase()
      );

      if (mine) {
        // short dramatic pause then reveal
        setTimeout(() => {
          onOutcome({
            tokenId: mine.args.tokenId as bigint,
            rarity:  Number(mine.args.rarity),
          });
        }, 1200);
        return;
      }

      // edge case: event not found (shouldn't happen with no-VRF)
      console.error("Scratched event not found in receipt logs");
      setPhase("idle");
    } catch (err) {
      console.error("Failed to parse receipt logs:", err);
      setPhase("idle");
    }
  }, [receipt.isSuccess, receipt.data, hash, address, onOutcome]);

  /* ── handle receipt error ────────────────────────────── */
  useEffect(() => {
    if (receipt.isError) {
      setPhase("idle");
      setHash(undefined);
    }
  }, [receipt.isError]);

  /* ── scratch action ──────────────────────────────────── */
  const runScratch = async () => {
    if (!isContractConfigured) return;

    let ref: Address = zeroAddress;
    const t = referrerIn.trim();
    if (t) {
      if (!isAddress(t)) {
        alert("Invalid referrer address.");
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

  /* ── reveal helpers ──────────────────────────────────── */
  const revealAllCells = () => setRevealed(Array(CELL).fill(true));

  const resetRound = () => {
    setPhase("idle");
    setHash(undefined);
    processedHash.current = undefined;
    setResultRarity(null);
    setRevealed(Array(CELL).fill(false));
    setWinOpen(false);
    setLossOpen(false);
  };

  /* ── misc ────────────────────────────────────────────── */
  const scratchPct = useMemo(
    () => Math.round((revealed.filter(Boolean).length / CELL) * 100),
    [revealed]
  );

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const tweet =
    resultRarity !== null
      ? `Just scratched on ROVA — got ${rarityLabel(resultRarity)}. Try your luck: ${shareUrl}`
      : "";

  const isBusy =
    isPending || phase === "confirm" || phase === "revealing";

  const scratchLabel = () => {
    if (phase === "confirm")   return "CONFIRMING…";
    if (phase === "revealing") return "REVEALING…";
    if (isPending)             return "CHECK WALLET…";
    return "★ SCRATCH (PAY)";
  };

  /* ─── not connected / wrong chain ───────────────────── */
  if (!isConnected || wrongChain) {
    return (
      <RetroCard className="shadow-[var(--shadow-xl)]">
        <RetroCardHeader>
          <RetroCardTitle className="text-center">
            {wrongChain ? "WRONG NETWORK" : "CONNECT WALLET"}
          </RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent className="space-y-4 text-center">
          <p className="font-sans text-sm text-muted-foreground">
            {wrongChain
              ? "Switch to Celo Mainnet to play."
              : "Connect your wallet to start scratching."}
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </RetroCardContent>
      </RetroCard>
    );
  }

  /* ─── main UI ────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── scratch card ── */}
      <RetroCard
        className={[
          "border-[3px] border-black bg-primary shadow-[var(--shadow-xl)]",
          shake    ? "animate-shake border-destructive" : "",
          flashWin ? "animate-flash-win"               : "",
        ].join(" ")}
      >
        <RetroCardHeader className="border-b-2 border-black bg-primary">
          <p className="font-head text-center text-lg font-black uppercase tracking-widest">
            SCRATCH CARD
          </p>
        </RetroCardHeader>

        <RetroCardContent className="space-y-4 p-4">
          {/* 3×3 grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {revealed.map((r, idx) => (
              <ScratchCell
                key={idx}
                revealed={r}
                rarity={r ? resultRarity : null}
                onClick={() => {
                  if (phase !== "done" || resultRarity === null) return;
                  setRevealed((prev) => {
                    const n = [...prev];
                    n[idx] = true;
                    return n;
                  });
                }}
              />
            ))}
          </div>

          {/* progress */}
          <RetroProgress value={scratchPct} />
          <p className="font-sans text-center text-xs font-bold text-muted-foreground">
            {revealed.filter(Boolean).length} / {CELL} scratched
          </p>

          {/* action row */}
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
              disabled={isBusy}
              onClick={resetRound}
            >
              RESET
            </RetroButton>
          </div>

          {/* referrer */}
          <RetroInput
            placeholder="Referrer wallet (optional — they get 5%)"
            value={referrerIn}
            onChange={(e) => setReferrerIn(e.target.value)}
            disabled={isBusy}
            className="font-mono text-xs"
          />

          {/* main CTA */}
          <RetroButton
            type="button"
            className="w-full shadow-[var(--shadow-md)]"
            disabled={!isContractConfigured || isBusy}
            onClick={() => void runScratch()}
          >
            {scratchLabel()}
          </RetroButton>

          {/* cost */}
          <p className="font-sans text-center text-sm text-muted-foreground">
            Cost:{" "}
            <strong>
              {mintFee > 0n ? `${formatEther(mintFee)} CELO` : "…"}
            </strong>{" "}
            per scratch
          </p>

          {/* session spend */}
          {sessionSpentWei > 0n && (
            <p className="font-sans text-center text-[11px] text-muted-foreground">
              Session total: {formatEther(sessionSpentWei)} CELO
            </p>
          )}

          {/* errors */}
          {error && (
            <p className="font-sans text-center text-sm font-bold text-destructive">
              Transaction failed. The blockchain said no. Try again.
            </p>
          )}
          {!isContractConfigured && (
            <p className="font-sans text-center text-sm font-bold">
              Set NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS in .env.local
            </p>
          )}
        </RetroCardContent>
      </RetroCard>

      {/* ── win dialog ── */}
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
            . Provably on-chain. Don&apos;t forget to flex.
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

      {/* ── loss dialog ── */}
      <RetroDialog open={lossOpen} onOpenChange={setLossOpen}>
        <RetroDialogContent>
          <RetroDialogTitle>NOT THIS TIME. ONE MORE?</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground">
            Common doesn&apos;t mean ordinary — it means you paid tuition to the
            chain. Hit scratch again.
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full"
            onClick={resetRound}
          >
            AGAIN
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      {/* ── run stats ── */}
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

      {/* ── rarity odds ── */}
      <RetroCard>
        <RetroCardHeader>
          <RetroCardTitle className="text-base">RARITY ODDS</RetroCardTitle>
        </RetroCardHeader>
        <RetroCardContent>
          <RarityOddsPanel />
        </RetroCardContent>
      </RetroCard>

      {/* ── share run ── */}
      <RetroButton
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Just scratched on ROVA — got ${
                resultRarity !== null ? rarityLabel(resultRarity) : "???"
              }. Try: ${shareUrl}`
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