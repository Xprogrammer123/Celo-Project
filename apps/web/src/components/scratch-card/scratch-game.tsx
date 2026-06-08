"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useState } from "react";
import { formatEther, zeroAddress, type Hex } from "viem";
import { useAccount, useChainId, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { configuredChain, explorerUrl, isTestnet } from "@/constants/chains";
import { ROVA_PER_GAME } from "@/constants/rova";
import { isContractConfigured } from "@/constants/contract";
import {
  DEMO_PLAYER_ID,
  recordNftRun,
  recordRoundWin,
  type LeaderboardMode,
} from "@/lib/player-profile";
import { NFT_PRIZE_PREVIEW } from "@/lib/nft-preview-art";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useRovaBalance } from "@/hooks/useRovaBalance";
import { useScratch } from "@/hooks/useScratch";
import { RetroButton } from "@/components/retroui/button";
import {
  RetroDialog,
  RetroDialogClose,
  RetroDialogContent,
  RetroDialogDescription,
  RetroDialogTitle,
} from "@/components/retroui/dialog";

/* ─── CONFIG ─────────────────────────────────────────── */

const GRID_COLS = 4;
const TRIES = 3;
const WINS_NEEDED = 3;

const ROVA_LOGO_SRC = "/logo.png";
const NFT_PRIZE_SRC = NFT_PRIZE_PREVIEW;

type TileKind = "rova" | "nft";

type Tile = {
  kind: TileKind;
  revealed: boolean;
  matched: boolean;
};

type Phase = "idle" | "playing" | "roundOver" | "nftWon";

type DialogType =
  | "roundWin"
  | "roundLoss"
  | "streakReset"
  | "nftMinting"
  | "nftWon"
  | "nftMintFailed"
  | "demoComplete"
  | null;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4×3 board: 10 ROVA logo tiles + 2 NFT prize tiles shuffled. */
function buildBoard(): Tile[] {
  const kinds = shuffle<TileKind>([
    ...Array(10).fill("rova"),
    ...Array(2).fill("nft"),
  ]);
  return kinds.map((kind) => ({
    kind,
    revealed: false,
    matched: false,
  }));
}

function countVisibleNfts(board: Tile[]) {
  return board.filter((t) => t.revealed && t.kind === "nft").length;
}

/* ─── TILE ───────────────────────────────────────────── */

function GameTile({
  tile,
  index,
  canFlip,
  onFlip,
}: {
  tile: Tile;
  index: number;
  canFlip: boolean;
  onFlip: (i: number) => void;
}) {
  const { kind, revealed, matched } = tile;
  const isNft = kind === "nft";
  const borderC = matched ? "#00c853" : isNft ? "#ffd700" : "#000";

  return (
    <button
      type="button"
      disabled={!canFlip || revealed}
      onClick={() => onFlip(index)}
      className="group relative focus:outline-none"
      style={{ perspective: 800 }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(.4,0,.2,1)",
          transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{
            backfaceVisibility: "hidden",
            background: "#f5efd0",
            border: "3px solid #000",
            cursor: canFlip ? "pointer" : "default",
            backgroundImage:
              "repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.04) 5px,rgba(255,255,255,.04) 10px)",
          }}
        >
          <span className="font-head text-4xl text-black/15 group-hover:text-black/30 transition-colors">
            {canFlip ? "?" : ""}
          </span>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none animate-tile-pop overflow-hidden p-2"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: isNft ? "#0a0a0a" : "#fffef5",
            border: `3px solid ${borderC}`,
            boxShadow: matched
              ? "0 0 20px rgba(0,200,83,0.6)"
              : isNft
                ? "0 0 20px rgba(255,215,0,0.45)"
                : "none",
          }}
        >
          {isNft ? (
            <>
              <img
                src={NFT_PRIZE_SRC}
                alt="NFT prize"
                className="h-[70%] w-full object-contain"
              />
              <span
                className="font-head tracking-widest text-[#ffd700]"
                style={{ fontSize: 10 }}
              >
                NFT PRIZE
              </span>
            </>
          ) : (
            <img
              src={ROVA_LOGO_SRC}
              alt="ROVA"
              className="h-[72%] w-[72%] object-contain"
            />
          )}
          {matched && (
            <span
              className="absolute top-1 right-1 font-head text-xs bg-[#00c853] text-black px-1"
            >
              MATCH
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── HUD ────────────────────────────────────────────── */

function TrialsLeft({ remaining }: { remaining: number }) {
  const used = TRIES - remaining;
  return (
    <div className="flex items-center gap-2">
      <span className="font-head text-xs tracking-widest text-muted-foreground">
        TRIALS
      </span>
      <div className="flex gap-1">
        {Array.from({ length: TRIES }).map((_, i) => (
          <div
            key={i}
            className="h-7 w-7 border-2 border-black flex items-center justify-center transition-all"
            style={{
              background: i < used ? "#333" : "#ffdb33",
              boxShadow: i < used ? "none" : "2px 2px 0 0 #000",
              opacity: i < used ? 0.5 : 1,
            }}
          >
            <span className="font-head text-xs text-black">
              {i < used ? "—" : i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StreakProgress({ wins }: { wins: number }) {
  const labels = ["0/3", "1/3", "2/3", "3/3"];
  const label = wins >= WINS_NEEDED ? "NFT!" : labels[wins] ?? "0/3";
  const pressure = wins === 2;

  return (
    <div className="flex items-center gap-2">
      <span className="font-head text-xs tracking-widest text-muted-foreground">
        STREAK
      </span>
      <div className="flex gap-1 items-center">
        {Array.from({ length: WINS_NEEDED }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-2 border-black transition-all"
            style={{
              width: 34,
              height: 34,
              background: i < wins ? "#00c853" : "#f3f3f3",
              boxShadow:
                i < wins
                  ? "3px 3px 0 0 #000, 0 0 12px rgba(0,200,83,0.4)"
                  : "2px 2px 0 0 #000",
            }}
          >
            <span
              className="font-head text-sm"
              style={{ color: i < wins ? "#000" : "#444" }}
            >
              {i < wins ? "\u2713" : ""}
            </span>
          </div>
        ))}
        <span
          className="font-head text-sm ml-1"
          style={{
            color: wins >= WINS_NEEDED ? "#ffd700" : pressure ? "#ffdb33" : "#666",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function NftFoundBadge({ found }: { found: number }) {
  return (
    <div
      className="inline-flex items-center gap-2 border-2 px-3 py-1"
      style={{
        background: found > 0 ? "#0a0a0a" : "#f3f3f3",
        borderColor: found === 2 ? "#00c853" : "#ffd700",
        boxShadow: found === 2 ? "0 0 16px rgba(0,200,83,0.5)" : "none",
      }}
    >
      <span
        className="font-head text-xs tracking-widest"
        style={{ color: found > 0 ? "#ffd700" : "#000" }}
      >
        NFT {found}/2
      </span>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────── */

export function ScratchGame() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongChain = isConnected && chainId !== configuredChain.id;
  const isDemo = !isContractConfigured;

  const {
    balance: rovaBalance,
    canAffordGame,
    deduct,
    hydrated: rovaHydrated,
  } = useRovaBalance();

  const {
    nftCount,
    scratchesToday,
    streak: onChainStreak,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = usePlayerStats();

  const { scratch, mintFee, isPending: isMintSigning } = useScratch();
  const [mintHash, setMintHash] = useState<Hex | undefined>();
  const [mintError, setMintError] = useState<string | null>(null);
  const [lastMintTxHash, setLastMintTxHash] = useState<Hex | undefined>();

  const mintReceipt = useWaitForTransactionReceipt({
    hash: mintHash,
    chainId: configuredChain.id,
    query: { enabled: !!mintHash },
  });

  const isMintConfirming =
    !!mintHash && (mintReceipt.isLoading || mintReceipt.isFetching);

  const triggerMint = useCallback(async () => {
    if (!isContractConfigured) {
      setMintError(
        "Contract not deployed. Run pnpm contracts:deploy:celo-sepolia and set NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS."
      );
      setDialogType("nftMintFailed");
      return;
    }
    setMintError(null);
    setDialogType("nftMinting");
    try {
      const hash = await scratch(zeroAddress);
      setMintHash(hash);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Mint failed.";
      setMintError(msg);
      setDialogType("nftMintFailed");
    }
  }, [scratch]);

  useEffect(() => {
    if (!mintHash || mintReceipt.isLoading || mintReceipt.isFetching) return;

    if (mintReceipt.isSuccess) {
      setLastMintTxHash(mintHash);
      setMintHash(undefined);
      void refetchStats();
      void confetti({
        particleCount: 280,
        spread: 100,
        origin: { y: 0.4 },
        colors: ["#7e22ce", "#ffdb33", "#00c853"],
      });
      setDialogType("nftWon");
      return;
    }

    if (mintReceipt.isError) {
      setMintHash(undefined);
      setMintError("Transaction failed on-chain. Try again.");
      setDialogType("nftMintFailed");
    }
  }, [
    mintHash,
    mintReceipt.isSuccess,
    mintReceipt.isError,
    mintReceipt.isLoading,
    mintReceipt.isFetching,
    refetchStats,
  ]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [board, setBoard] = useState<Tile[]>(buildBoard);
  const [trialsLeft, setTrialsLeft] = useState(TRIES);
  const [winStreak, setWinStreak] = useState(0);
  const [roundNum, setRoundNum] = useState(0);
  const [nftsFound, setNftsFound] = useState(0);
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const newRound = useCallback(() => {
    setBoard(buildBoard());
    setTrialsLeft(TRIES);
    setNftsFound(0);
    setFirstPick(null);
    setResolving(false);
    setPhase("playing");
    setRoundNum((n) => n + 1);
    setPayError(null);
  }, []);

  const newGame = useCallback(() => {
    setWinStreak(0);
    setRoundNum(0);
    setDialogType(null);
    setPhase("idle");
    setBoard(buildBoard());
    setTrialsLeft(TRIES);
    setNftsFound(0);
    setFirstPick(null);
    setResolving(false);
    setPayError(null);
    setMintHash(undefined);
    setMintError(null);
    setLastMintTxHash(undefined);
  }, []);

  const finishRound = useCallback(
    (won: boolean, finalBoard: Tile[]) => {
      setTimeout(() => {
        setBoard(finalBoard.map((t) => ({ ...t, revealed: true })));
      }, 500);

      setTimeout(() => {
        if (won) {
          const mode: LeaderboardMode = demoMode ? "demo" : "real";
          const playerId = address?.toLowerCase() ?? DEMO_PLAYER_ID;
          recordRoundWin(mode, playerId);

          const nextWins = winStreak + 1;
          setWinStreak(nextWins);
          void confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#7e22ce", "#ffdb33", "#00c853"],
          });

          if (nextWins >= WINS_NEEDED) {
            recordNftRun(mode, playerId);
            if (demoMode) {
              setPhase("roundOver");
              setDialogType("demoComplete");
              return;
            }
            setPhase("nftWon");
            void triggerMint();
          } else {
            setPhase("roundOver");
            setDialogType("roundWin");
          }
        } else {
          setWinStreak(0);
          setPhase("roundOver");
          setDialogType(winStreak > 0 ? "streakReset" : "roundLoss");
        }
      }, 1200);
    },
    [winStreak, demoMode, address, triggerMint]
  );

  const handleFlip = useCallback(
    (i: number) => {
      if (
        phase !== "playing" ||
        trialsLeft <= 0 ||
        board[i].revealed ||
        resolving
      )
        return;

      const next = [...board];
      next[i] = { ...next[i], revealed: true };
      setBoard(next);
      setNftsFound(countVisibleNfts(next));

      if (firstPick === null) {
        setFirstPick(i);
        if (next[i].kind === "nft") {
          void confetti({
            particleCount: 24,
            spread: 32,
            origin: { y: 0.6 },
            colors: ["#ffd700", "#ffdb33"],
          });
        }
        return;
      }

      const previousPick = firstPick;
      const remainingTrials = trialsLeft - 1;
      setTrialsLeft(remainingTrials);
      setFirstPick(null);
      setResolving(true);

      const isNftPair =
        next[previousPick].kind === "nft" && next[i].kind === "nft";

      if (isNftPair) {
        const matchedBoard = next.map((tile, idx) =>
          idx === previousPick || idx === i ? { ...tile, matched: true } : tile
        );
        setBoard(matchedBoard);
        setNftsFound(2);
        setTimeout(() => {
          setResolving(false);
          finishRound(true, matchedBoard);
        }, 450);
        return;
      }

      // Memory-game behavior: mismatched pair always flips back face-down.
      setTimeout(() => {
        const closedBoard = next.map((tile, idx) =>
          idx === previousPick || idx === i
            ? { ...tile, revealed: false }
            : tile
        );
        setBoard(closedBoard);
        setNftsFound(0);
        setResolving(false);

        if (remainingTrials === 0) {
          finishRound(false, closedBoard);
        }
      }, 750);
    },
    [phase, trialsLeft, board, resolving, firstPick, finishRound]
  );

  const startRound = useCallback(() => {
    if (!rovaHydrated) return;

    if (!demoMode && !deduct(ROVA_PER_GAME)) {
      setPayError(`Need ${ROVA_PER_GAME} ROVA to play. Buy a pack in the sidebar.`);
      return;
    }

    newRound();
  }, [rovaHydrated, deduct, newRound, demoMode]);

  const toggleMode = useCallback((nextDemoMode: boolean) => {
    setDemoMode(nextDemoMode);
    setDialogType(null);
    setWinStreak(0);
    setRoundNum(0);
    setPhase("idle");
    setTrialsLeft(TRIES);
    setBoard(buildBoard());
    setFirstPick(null);
    setResolving(false);
    setNftsFound(0);
    setPayError(null);
  }, []);

  const canFlip = phase === "playing" && trialsLeft > 0 && !resolving;

  return (
    <div className="space-y-4">
      <GameBoard
        board={board}
        phase={phase}
        trialsLeft={trialsLeft}
        winStreak={winStreak}
        nftsFound={nftsFound}
        roundNum={roundNum}
        rovaBalance={rovaBalance}
        rovaHydrated={rovaHydrated}
        canAffordGame={canAffordGame}
        canFlip={canFlip}
        firstPickActive={firstPick !== null}
        resolving={resolving}
        demoMode={demoMode}
        payError={payError}
        isDemo={isDemo}
        onToggleMode={toggleMode}
        onFlip={handleFlip}
        onStart={startRound}
        onNewGame={newGame}
        nftCount={nftCount}
        scratchesToday={scratchesToday}
        onChainStreak={onChainStreak}
        statsLoading={statsLoading}
      />

      {!isConnected || wrongChain ? (
        <div className="border-2 border-border bg-card p-4 text-center text-foreground space-y-3">
          <p className="font-head text-sm uppercase tracking-widest">
            {wrongChain ? "Wrong network" : "Connect for on-chain NFT mint"}
          </p>
          <ConnectButton />
          <p className="font-sans text-xs text-muted-foreground">
            Guest demo works without wallet — ROVA balance saved locally.
          </p>
        </div>
      ) : null}

      <ResultDialog
        type={dialogType}
        winStreak={winStreak}
        demoMode={demoMode}
        mintError={mintError}
        mintFeeLabel={
          mintFee > 0n ? `${formatEther(mintFee)} CELO` : "0.001 CELO"
        }
        isMintPending={isMintSigning || isMintConfirming}
        lastMintTxHash={lastMintTxHash}
        explorerUrl={explorerUrl}
        isTestnet={isTestnet}
        onRetryMint={() => void triggerMint()}
        onNextRound={() => {
          setDialogType(null);
          setPhase("idle");
        }}
        onNewGame={() => {
          setDialogType(null);
          newGame();
        }}
        onClose={() => setDialogType(null)}
      />
    </div>
  );
}

/* ─── BOARD SHELL ────────────────────────────────────── */

function GameBoard({
  board,
  phase,
  trialsLeft,
  winStreak,
  nftsFound,
  roundNum,
  rovaBalance,
  rovaHydrated,
  canAffordGame,
  canFlip,
  firstPickActive,
  resolving,
  demoMode,
  payError,
  isDemo,
  onToggleMode,
  onFlip,
  onStart,
  onNewGame,
  nftCount,
  scratchesToday,
  onChainStreak,
  statsLoading,
}: {
  board: Tile[];
  phase: Phase;
  trialsLeft: number;
  winStreak: number;
  nftsFound: number;
  roundNum: number;
  rovaBalance: number;
  rovaHydrated: boolean;
  canAffordGame: boolean;
  canFlip: boolean;
  firstPickActive: boolean;
  resolving: boolean;
  demoMode: boolean;
  payError: string | null;
  isDemo: boolean;
  onToggleMode: (nextDemoMode: boolean) => void;
  onFlip: (i: number) => void;
  onStart: () => void;
  onNewGame: () => void;
  nftCount: bigint;
  scratchesToday: bigint;
  onChainStreak: bigint;
  statsLoading: boolean;
}) {
  const statusText =
    phase === "idle"
      ? "READY — MATCH BOTH NFT PRIZES"
      : phase === "playing"
        ? `ROUND ${roundNum} — ${trialsLeft} TRIAL${trialsLeft !== 1 ? "S" : ""} LEFT`
        : phase === "nftWon"
          ? "NFT UNLOCKED"
          : "ROUND COMPLETE";

  return (
    <div className="border-[3px] border-black shadow-[var(--shadow-xl)] overflow-hidden bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-muted px-4 py-3">
        <TrialsLeft remaining={trialsLeft} />
        <NftFoundBadge found={nftsFound} />
        <StreakProgress wins={winStreak} />
      </div>

      <div className="flex items-center justify-between bg-background px-4 py-2 border-b border-border">
        <span className="font-head text-xs tracking-[0.25em] text-muted-foreground">
          {statusText}
        </span>
        <span className="font-sans text-[9px] font-bold tracking-widest text-primary/70">
          {demoMode ? "FREE DEMO MODE" : rovaHydrated ? `${rovaBalance} ROVA` : "..."}
          {isDemo ? " · DEMO CHAIN" : ""}
        </span>
      </div>

      <div
        className="grid gap-3 p-5 sm:gap-4 sm:p-6 md:p-7 mx-auto max-w-3xl"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
      >
        {board.map((tile, i) => (
          <GameTile
            key={`${roundNum}-${i}`}
            tile={tile}
            index={i}
            canFlip={canFlip}
            onFlip={onFlip}
          />
        ))}
      </div>

      <div className="space-y-2 border-t-2 border-black bg-white p-4">
        <div className="grid grid-cols-2 gap-2">
          <RetroButton
            type="button"
            size="sm"
            variant={demoMode ? "default" : "outline"}
            onClick={() => onToggleMode(true)}
          >
            DEMO MODE
          </RetroButton>
          <RetroButton
            type="button"
            size="sm"
            variant={!demoMode ? "default" : "outline"}
            onClick={() => onToggleMode(false)}
          >
            PLAY WITH ROVA
          </RetroButton>
        </div>

        {(phase === "idle" || phase === "roundOver") && (
          <RetroButton
            type="button"
            className="w-full text-base shadow-[var(--shadow-md)]"
            disabled={!rovaHydrated || (!demoMode && !canAffordGame)}
            onClick={onStart}
          >
            {demoMode
              ? phase === "roundOver"
                ? "PLAY DEMO AGAIN"
                : "START FREE DEMO"
              : phase === "roundOver"
                ? `PLAY AGAIN — ${ROVA_PER_GAME} ROVA`
                : `START GAME — ${ROVA_PER_GAME} ROVA`}
          </RetroButton>
        )}

        {phase === "playing" && (
          <p className="font-head text-center text-sm tracking-wider text-black">
            {resolving
              ? "CHECKING PAIR..."
              : firstPickActive
                ? "PICK 1 MORE CARD TO FINISH THIS TRIAL"
                : `START TRIAL ${TRIES - trialsLeft + 1} — PICK 2 CARDS`}
          </p>
        )}

        {phase === "nftWon" && (
          <div className="space-y-2 text-center">
            <p className="font-head text-lg tracking-wider text-black">
              3 WINS IN A ROW — NFT EARNED
            </p>
            <RetroButton type="button" className="w-full" onClick={onNewGame}>
              NEW RUN (RESET STREAK)
            </RetroButton>
          </div>
        )}

        {!demoMode && !canAffordGame && rovaHydrated && phase !== "playing" && (
          <p className="font-sans text-center text-xs text-destructive">
            Not enough ROVA — buy a pack ({ROVA_PER_GAME} ROVA per game).
          </p>
        )}

        {demoMode && (
          <p className="font-sans text-center text-xs text-muted-foreground">
            Demo is free and fun, but demo wins do not mint NFTs.
          </p>
        )}

        {payError && (
          <p className="font-sans text-center text-xs font-bold text-destructive">
            {payError}
          </p>
        )}

        <p className="font-sans text-center text-[10px] text-muted-foreground">
          4×3 board · 2 hidden NFT prizes · ROVA logo decoys · 1 trial = 2 picks
        </p>
      </div>

      {!isDemo && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-muted px-4 py-2 font-sans text-xs">
          <span>
            NFTs: <strong>{statsLoading ? "…" : nftCount.toString()}</strong>
          </span>
          <span>
            Today:{" "}
            <strong>
              {statsLoading ? "…" : `${scratchesToday.toString()} / 5`}
            </strong>
          </span>
          <span>
            Daily streak:{" "}
            <strong>{statsLoading ? "…" : onChainStreak.toString()}d</strong>
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── DIALOGS ────────────────────────────────────────── */

function ResultDialog({
  type,
  winStreak,
  demoMode,
  mintError,
  mintFeeLabel,
  isMintPending,
  lastMintTxHash,
  explorerUrl,
  isTestnet,
  onRetryMint,
  onNextRound,
  onNewGame,
  onClose,
}: {
  type: DialogType;
  winStreak: number;
  demoMode: boolean;
  mintError: string | null;
  mintFeeLabel: string;
  isMintPending: boolean;
  lastMintTxHash?: Hex;
  explorerUrl: string;
  isTestnet: boolean;
  onRetryMint: () => void;
  onNextRound: () => void;
  onNewGame: () => void;
  onClose: () => void;
}) {
  if (!type) return null;

  const txUrl = lastMintTxHash
    ? `${explorerUrl}/tx/${lastMintTxHash}`
    : null;

  return (
    <>
      <RetroDialog open={type === "roundWin"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>BOTH NFT PRIZES MATCHED!</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>You matched both NFT prize cards within your trials.</p>
            <p>
              Win streak:{" "}
              <strong>
                {winStreak} / {WINS_NEEDED}
              </strong>
              {winStreak === 2
                ? " — one more clean win for the NFT!"
                : winStreak === 1
                  ? " — momentum building."
                  : ""}
            </p>
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full mt-3"
            onClick={onNextRound}
          >
            NEXT ROUND ({ROVA_PER_GAME} ROVA)
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog open={type === "roundLoss"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>NO MATCH</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              You used all 3 trials without matching both NFT prizes. Streak
              stays at 0/3.
            </p>
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full mt-3"
            onClick={onNextRound}
          >
            TRY AGAIN
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog
        open={type === "streakReset"}
        onOpenChange={() => onClose()}
      >
        <RetroDialogContent>
          <RetroDialogTitle>STREAK WIPED</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              You had progress on your streak, but this loss resets everything
              to <strong>0 / {WINS_NEEDED}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Every flip matters. String 3 wins in a row with zero losses.
            </p>
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full mt-3"
            onClick={onNextRound}
          >
            START FRESH
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog open={type === "nftMinting"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>MINTING NFT…</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              3 wins locked in. Confirm the mint in your wallet (
              {mintFeeLabel}).
            </p>
            {isMintPending && (
              <p className="text-sm text-muted-foreground">
                Waiting for wallet / block confirmation…
              </p>
            )}
          </RetroDialogDescription>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog open={type === "nftMintFailed"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>MINT FAILED</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>{mintError ?? "Could not mint NFT. Try again."}</p>
          </RetroDialogDescription>
          <RetroButton
            type="button"
            className="w-full mt-3"
            onClick={onRetryMint}
          >
            RETRY MINT
          </RetroButton>
          <RetroButton
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={onNewGame}
          >
            START OVER
          </RetroButton>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog open={type === "nftWon"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>3/3 — NFT MINTED</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              Three consecutive wins.{" "}
              {isTestnet
                ? "Testnet LOOT NFT is in your wallet on Celo Sepolia."
                : "LOOT NFT minted to your wallet on Celo."}
            </p>
            {txUrl && (
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline block"
              >
                View on explorer →
              </a>
            )}
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full mt-3"
            onClick={onNewGame}
          >
            PLAY NEW RUN
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      <RetroDialog
        open={type === "demoComplete"}
        onOpenChange={() => onClose()}
      >
        <RetroDialogContent>
          <RetroDialogTitle>DEMO CLEARED!</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>You completed a 3-win streak in demo mode.</p>
            <p className="text-sm text-muted-foreground">
              Demo does not mint NFTs. Switch to <strong>PLAY WITH ROVA</strong>{" "}
              to play for real rewards.
            </p>
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full mt-3"
            onClick={onNextRound}
          >
            CONTINUE DEMO
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>
    </>
  );
}
