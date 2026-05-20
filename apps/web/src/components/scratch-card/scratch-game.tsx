"use client";

import confetti from "canvas-confetti";
import { useCallback, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { configuredChain } from "@/constants/chains";
import { ROVA_PER_GAME } from "@/constants/rova";
import { isContractConfigured } from "@/constants/contract";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import { useRovaBalance } from "@/hooks/useRovaBalance";
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
const EPIC_RARITY = 2;

type Tile = {
  rarity: number;
  revealed: boolean;
  matched: boolean;
};

type Phase = "idle" | "playing" | "roundOver" | "nftWon";

type DialogType = "roundWin" | "roundLoss" | "streakReset" | "nftWon" | null;

/* ─── VISUALS ────────────────────────────────────────── */

const R = {
  bg: ["#bbb", "#ffdb33", "#7e22ce", "#0a0a0a"],
  fg: ["#333", "#000", "#fff", "#ffd700"],
  border: ["#999", "#000", "#5b21b6", "#ffd700"],
  icon: ["\u00b7", "\u2726", "\u25c6", "\u2605"],
  glow: [
    "none",
    "0 0 12px #ffdb33",
    "0 0 16px #a855f7",
    "0 0 20px #ffd700",
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 4×3 board: 10 decoys (6 common, 4 rare) + 2 epic cards shuffled. */
function buildBoard(): Tile[] {
  const rarities = shuffle([
    ...Array(6).fill(0),
    ...Array(4).fill(1),
    ...Array(2).fill(EPIC_RARITY),
  ]);
  return rarities.map((rarity) => ({
    rarity,
    revealed: false,
    matched: false,
  }));
}

function countVisibleEpics(board: Tile[]) {
  return board.filter((t) => t.revealed && t.rarity === EPIC_RARITY).length;
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
  const { rarity, revealed, matched } = tile;
  const isEpic = rarity === EPIC_RARITY;
  const bg = R.bg[rarity];
  const fg = R.fg[rarity];
  const label = isEpic ? "EPIC" : ["COM", "RARE"][rarity] ?? "???";
  const borderC = matched
    ? "#00c853"
    : revealed
      ? R.border[rarity]
      : "#333";

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
            background: "#1a1a1a",
            border: "3px solid #333",
            cursor: canFlip ? "pointer" : "default",
            backgroundImage:
              "repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.04) 5px,rgba(255,255,255,.04) 10px)",
          }}
        >
          <span className="font-head text-4xl text-white/10 group-hover:text-white/25 transition-colors">
            {canFlip ? "?" : ""}
          </span>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none animate-tile-pop"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: bg,
            border: `3px solid ${borderC}`,
            boxShadow: matched
              ? "0 0 20px rgba(0,200,83,0.6)"
              : revealed
                ? R.glow[rarity]
                : "none",
          }}
        >
          <span style={{ fontSize: isEpic ? 32 : 28, color: fg }}>
            {R.icon[rarity]}
          </span>
          <span
            className="font-head tracking-widest"
            style={{ fontSize: 11, color: fg }}
          >
            {label}
          </span>
          {matched && (
            <span
              className="absolute top-1 right-1 font-head text-xs"
              style={{ color: "#00c853" }}
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
      <span className="font-head text-xs tracking-widest text-white/40">
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
      <span className="font-head text-xs tracking-widest text-white/40">
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
              background: i < wins ? "#00c853" : "#1a1a1a",
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

function EpicFoundBadge({ found }: { found: number }) {
  return (
    <div
      className="inline-flex items-center gap-2 border-2 px-3 py-1"
      style={{
        background: found > 0 ? "#7e22ce" : "#222",
        borderColor: found === 2 ? "#00c853" : "#5b21b6",
        boxShadow: found === 2 ? "0 0 16px rgba(0,200,83,0.5)" : "none",
      }}
    >
      <span className="font-head text-xs text-white tracking-widest">
        EPIC {found}/2
      </span>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────── */

export function ScratchGame() {
  const { isConnected } = useAccount();
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

  const [phase, setPhase] = useState<Phase>("idle");
  const [board, setBoard] = useState<Tile[]>(buildBoard);
  const [trialsLeft, setTrialsLeft] = useState(TRIES);
  const [winStreak, setWinStreak] = useState(0);
  const [roundNum, setRoundNum] = useState(0);
  const [epicsFound, setEpicsFound] = useState(0);
  const [firstPick, setFirstPick] = useState<number | null>(null);
  const [resolving, setResolving] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const newRound = useCallback(() => {
    setBoard(buildBoard());
    setTrialsLeft(TRIES);
    setEpicsFound(0);
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
    setEpicsFound(0);
    setFirstPick(null);
    setResolving(false);
    setPayError(null);
  }, []);

  const finishRound = useCallback(
    (won: boolean, finalBoard: Tile[]) => {
      setTimeout(() => {
        setBoard(finalBoard.map((t) => ({ ...t, revealed: true })));
      }, 500);

      setTimeout(() => {
        if (won) {
          const nextWins = winStreak + 1;
          setWinStreak(nextWins);
          void confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#7e22ce", "#ffdb33", "#00c853"],
          });

          if (nextWins >= WINS_NEEDED) {
            void confetti({
              particleCount: 280,
              spread: 100,
              origin: { y: 0.4 },
            });
            setPhase("nftWon");
            setDialogType("nftWon");
            void refetchStats();
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
    [winStreak, refetchStats]
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
      setEpicsFound(countVisibleEpics(next));

      if (firstPick === null) {
        setFirstPick(i);
        if (next[i].rarity === EPIC_RARITY) {
          void confetti({
            particleCount: 24,
            spread: 32,
            origin: { y: 0.6 },
            colors: ["#a855f7"],
          });
        }
        return;
      }

      const previousPick = firstPick;
      const remainingTrials = trialsLeft - 1;
      setTrialsLeft(remainingTrials);
      setFirstPick(null);
      setResolving(true);

      const isEpicPair =
        next[previousPick].rarity === EPIC_RARITY &&
        next[i].rarity === EPIC_RARITY;

      if (isEpicPair) {
        const matchedBoard = next.map((tile, idx) =>
          idx === previousPick || idx === i ? { ...tile, matched: true } : tile
        );
        setBoard(matchedBoard);
        setEpicsFound(2);
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
        setEpicsFound(0);
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

    if (!deduct(ROVA_PER_GAME)) {
      setPayError(`Need ${ROVA_PER_GAME} ROVA to play. Buy a pack in the sidebar.`);
      return;
    }

    newRound();
  }, [rovaHydrated, deduct, newRound]);

  const canFlip = phase === "playing" && trialsLeft > 0 && !resolving;

  return (
    <div className="space-y-4">
      <GameBoard
        board={board}
        phase={phase}
        trialsLeft={trialsLeft}
        winStreak={winStreak}
        epicsFound={epicsFound}
        roundNum={roundNum}
        rovaBalance={rovaBalance}
        rovaHydrated={rovaHydrated}
        canAffordGame={canAffordGame}
        canFlip={canFlip}
        firstPickActive={firstPick !== null}
        resolving={resolving}
        payError={payError}
        isDemo={isDemo}
        onFlip={handleFlip}
        onStart={startRound}
        onNewGame={newGame}
        nftCount={nftCount}
        scratchesToday={scratchesToday}
        onChainStreak={onChainStreak}
        statsLoading={statsLoading}
      />

      {!isConnected || wrongChain ? (
        <div className="border-2 border-[#333] bg-[#111] p-4 text-center text-white space-y-3">
          <p className="font-head text-sm uppercase tracking-widest">
            {wrongChain ? "Wrong network" : "Connect for on-chain NFT mint"}
          </p>
          <ConnectButton />
          <p className="font-sans text-xs text-white/40">
            Guest demo works without wallet — ROVA balance saved locally.
          </p>
        </div>
      ) : null}

      <ResultDialog
        type={dialogType}
        winStreak={winStreak}
        isDemo={isDemo}
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
  epicsFound,
  roundNum,
  rovaBalance,
  rovaHydrated,
  canAffordGame,
  canFlip,
  firstPickActive,
  resolving,
  payError,
  isDemo,
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
  epicsFound: number;
  roundNum: number;
  rovaBalance: number;
  rovaHydrated: boolean;
  canAffordGame: boolean;
  canFlip: boolean;
  firstPickActive: boolean;
  resolving: boolean;
  payError: string | null;
  isDemo: boolean;
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
      ? "READY — FIND BOTH EPIC CARDS"
      : phase === "playing"
        ? `ROUND ${roundNum} — ${trialsLeft} TRIAL${trialsLeft !== 1 ? "S" : ""} LEFT`
        : phase === "nftWon"
          ? "NFT UNLOCKED"
          : "ROUND COMPLETE";

  return (
    <div
      className="border-[3px] border-black shadow-[var(--shadow-xl)] overflow-hidden"
      style={{ background: "#111" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-black px-4 py-3">
        <TrialsLeft remaining={trialsLeft} />
        <EpicFoundBadge found={epicsFound} />
        <StreakProgress wins={winStreak} />
      </div>

      <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 border-b border-[#333]">
        <span className="font-head text-xs tracking-[0.25em] text-white/40">
          {statusText}
        </span>
        <span className="font-sans text-[9px] font-bold tracking-widest text-primary/70">
          {rovaHydrated ? `${rovaBalance} ROVA` : "..."}
          {isDemo ? " · DEMO" : ""}
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
        {(phase === "idle" || phase === "roundOver") && (
          <RetroButton
            type="button"
            className="w-full text-base shadow-[var(--shadow-md)]"
            disabled={!rovaHydrated || !canAffordGame}
            onClick={onStart}
          >
            {phase === "roundOver"
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

        {!canAffordGame && rovaHydrated && phase !== "playing" && (
          <p className="font-sans text-center text-xs text-destructive">
            Not enough ROVA — buy a pack ({ROVA_PER_GAME} ROVA per game).
          </p>
        )}

        {payError && (
          <p className="font-sans text-center text-xs font-bold text-destructive">
            {payError}
          </p>
        )}

        <p className="font-sans text-center text-[10px] text-muted-foreground">
          4×3 board · 2 hidden Epic cards · 1 trial = 2 picks · lose once = streak wiped
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
  isDemo,
  onNextRound,
  onNewGame,
  onClose,
}: {
  type: DialogType;
  winStreak: number;
  isDemo: boolean;
  onNextRound: () => void;
  onNewGame: () => void;
  onClose: () => void;
}) {
  if (!type) return null;

  return (
    <>
      <RetroDialog open={type === "roundWin"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>BOTH EPICS FOUND!</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>You matched both Epic cards within your trials.</p>
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
              You used all 3 trials without finding both Epic cards. Streak
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

      <RetroDialog open={type === "nftWon"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>3/3 — NFT MINTED</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              Three consecutive wins without a loss.{" "}
              {isDemo
                ? "Deploy the contract to mint real NFTs on-chain."
                : "Your NFT is on its way to your wallet."}
            </p>
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
    </>
  );
}
