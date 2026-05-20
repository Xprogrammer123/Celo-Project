"use client";

import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatEther,
  parseEventLogs,
  zeroAddress,
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
import { RetroButton } from "@/components/retroui/button";
import {
  RetroDialog,
  RetroDialogClose,
  RetroDialogContent,
  RetroDialogDescription,
  RetroDialogTitle,
} from "@/components/retroui/dialog";

/* ─── TYPES ──────────────────────────────────────────── */

const GRID = 12; // 4x3 board
const TRIES = 3;
const WINS_NEEDED = 3;

type Tile = { rarity: number; revealed: boolean; locked: boolean };

type Phase =
  | "idle"       // waiting for player to start
  | "paying"     // wallet tx pending
  | "waiting"    // on-chain confirmation
  | "playing"    // board is live, player has flips
  | "roundOver"  // all 3 flips used, showing result
  | "nftWon";    // 3 wins hit, NFT minted / demo win

/* ─── RARITY VISUALS ─────────────────────────────────── */

const R = {
  bg:     ["#bbb",   "#ffdb33", "#7e22ce", "#0a0a0a"],
  fg:     ["#333",   "#000",    "#fff",    "#ffd700"],
  border: ["#999",   "#000",    "#5b21b6", "#ffd700"],
  icon:   ["\u00b7", "\u2726",  "\u25c6",  "\u2605"],
  glow:   ["none",   "0 0 12px #ffdb33", "0 0 16px #a855f7", "0 0 20px #ffd700"],
};

/* ─── BOARD GENERATOR ────────────────────────────────── */
// Distribution per board: 6 Common, 3 Rare, 2 Epic, 1 Legendary
function buildBoard(): Tile[] {
  const rarities = [
    ...Array(6).fill(0),
    ...Array(3).fill(1),
    ...Array(2).fill(2),
    ...Array(1).fill(3),
  ];
  for (let i = rarities.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rarities[i], rarities[j]] = [rarities[j], rarities[i]];
  }
  return rarities.map((r) => ({ rarity: r, revealed: false, locked: false }));
}

/* ─── TILE COMPONENT ─────────────────────────────────── */

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
  const { rarity, revealed, locked } = tile;
  const bg = R.bg[rarity];
  const fg = R.fg[rarity];
  const icon = R.icon[rarity];
  const label = ["COM", "RARE", "EPIC", "LEG"][rarity];
  const borderC = revealed ? R.border[rarity] : "#000";
  const glow = revealed ? R.glow[rarity] : "none";

  return (
    <button
      type="button"
      disabled={!canFlip || revealed}
      onClick={() => onFlip(index)}
      className="group relative focus:outline-none"
      style={{ perspective: 800 }}
    >
      <div
        className="tile-flip-inner"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(.4,0,.2,1)",
          transform: revealed ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT — hidden */}
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "#1a1a1a",
            border: "3px solid #333",
            cursor: canFlip ? "pointer" : "default",
            backgroundImage:
              "repeating-linear-gradient(45deg,transparent,transparent 5px,rgba(255,255,255,.04) 5px,rgba(255,255,255,.04) 10px)",
          }}
        >
          <span className="font-head text-3xl text-white/10 group-hover:text-white/25 transition-colors">
            {canFlip ? "?" : ""}
          </span>
        </div>

        {/* BACK — revealed rarity */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 select-none"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: bg,
            border: `3px solid ${borderC}`,
            boxShadow: glow,
          }}
        >
          <span style={{ fontSize: rarity >= 2 ? 28 : 32, color: fg }}>
            {icon}
          </span>
          <span
            className="font-head tracking-widest"
            style={{ fontSize: 11, color: fg }}
          >
            {label}
          </span>
          {locked && (
            <span className="absolute top-1 right-1 text-xs">✓</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── HUD COMPONENTS ─────────────────────────────────── */

function FlipsLeft({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-head text-xs tracking-widest text-muted-foreground">
        FLIPS
      </span>
      <div className="flex gap-1">
        {Array.from({ length: TRIES }).map((_, i) => (
          <div
            key={i}
            className="h-6 w-6 border-2 border-black flex items-center justify-center transition-all duration-200"
            style={{
              background: i < count ? "#ffdb33" : "#e5e5e5",
              boxShadow: i < count ? "2px 2px 0 0 #000" : "none",
              transform: i < count ? "scale(1)" : "scale(0.85)",
            }}
          >
            <span className="font-head text-xs">
              {i < count ? "\u2605" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WinProgress({ wins }: { wins: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-head text-xs tracking-widest text-muted-foreground">
        WINS
      </span>
      <div className="flex gap-1">
        {Array.from({ length: WINS_NEEDED }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-2 border-black transition-all duration-300"
            style={{
              width: 32,
              height: 32,
              background: i < wins ? "#00c853" : "#1a1a1a",
              boxShadow:
                i < wins
                  ? "3px 3px 0 0 #000, 0 0 12px rgba(0,200,83,0.4)"
                  : "2px 2px 0 0 #000",
              transform: i < wins ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span
              className="font-head text-sm"
              style={{ color: i < wins ? "#000" : "#333" }}
            >
              {i < wins ? "\u2713" : `${i + 1}`}
            </span>
          </div>
        ))}
        <div
          className="flex items-center justify-center border-2 transition-all duration-300"
          style={{
            width: 32,
            height: 32,
            background: wins >= WINS_NEEDED ? "#ffd700" : "#2a2a2a",
            borderColor: wins >= WINS_NEEDED ? "#ffd700" : "#555",
            boxShadow:
              wins >= WINS_NEEDED
                ? "3px 3px 0 0 #000, 0 0 20px rgba(255,215,0,0.5)"
                : "none",
          }}
        >
          <span className="text-sm">
            {wins >= WINS_NEEDED ? "\u2605" : "NFT"}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoundBestDisplay({ best }: { best: number | null }) {
  if (best === null) return null;
  const bg = R.bg[best];
  const fg = R.fg[best];
  return (
    <div
      className="inline-flex items-center gap-2 border-2 border-black px-3 py-1"
      style={{ background: bg, boxShadow: R.glow[best] }}
    >
      <span style={{ fontSize: 18, color: fg }}>{R.icon[best]}</span>
      <span className="font-head text-sm" style={{ color: fg }}>
        {rarityLabel(best)}
      </span>
    </div>
  );
}

/* ─── MAIN GAME ──────────────────────────────────────── */

export function ScratchGame() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const wrongChain = isConnected && chainId !== configuredChain.id;
  const isDemo = !isContractConfigured;

  const {
    nftCount,
    scratchesToday,
    streak,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = usePlayerStats();

  const { scratch, mintFee, isPending, error, sessionSpentWei } = useScratch();

  const [phase, setPhase] = useState<Phase>("idle");
  const [board, setBoard] = useState<Tile[]>(buildBoard);
  const [flipsLeft, setFlipsLeft] = useState(TRIES);
  const [wins, setWins] = useState(0);
  const [roundBest, setRoundBest] = useState<number | null>(null);
  const [roundNum, setRoundNum] = useState(0);

  const [hash, setHash] = useState<Hex | undefined>();
  const processedHash = useRef<Hex | undefined>(undefined);

  const [dialogType, setDialogType] = useState<
    "roundWin" | "roundLoss" | "nftWon" | null
  >(null);

  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId: configuredChain.id,
    query: { enabled: !!hash },
  });

  /* ── Start a new round (shuffle board, reset flips) ── */
  const newRound = useCallback(() => {
    setBoard(buildBoard());
    setFlipsLeft(TRIES);
    setRoundBest(null);
    setPhase("playing");
    setRoundNum((n) => n + 1);
  }, []);

  /* ── Start fresh game (reset wins too) ── */
  const newGame = useCallback(() => {
    setWins(0);
    setRoundNum(0);
    setHash(undefined);
    processedHash.current = undefined;
    setDialogType(null);
    newRound();
  }, [newRound]);

  /* ── Handle tile flip ── */
  const handleFlip = useCallback(
    (i: number) => {
      if (phase !== "playing" || flipsLeft <= 0 || board[i].revealed) return;

      const next = [...board];
      next[i] = { ...next[i], revealed: true };
      setBoard(next);

      const rarity = next[i].rarity;
      setRoundBest((prev) => (prev === null ? rarity : Math.max(prev, rarity)));

      const remaining = flipsLeft - 1;
      setFlipsLeft(remaining);

      if (remaining === 0) {
        const best =
          rarity > (roundBest ?? -1) ? rarity : roundBest ?? rarity;
        const isWin = best >= 2; // Epic or Legendary = win

        setTimeout(() => {
          // reveal entire board so player can see what they missed
          setBoard((b) => b.map((t) => ({ ...t, revealed: true })));
        }, 600);

        setTimeout(() => {
          if (isWin) {
            const newWins = wins + 1;
            setWins(newWins);
            void confetti({
              particleCount: 100,
              spread: 60,
              origin: { y: 0.5 },
            });
            if (newWins >= WINS_NEEDED) {
              void confetti({
                particleCount: 250,
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
            setPhase("roundOver");
            setDialogType("roundLoss");
          }
        }, 1400);
      }
    },
    [phase, flipsLeft, board, roundBest, wins, refetchStats]
  );

  /* ── On-chain receipt processing ── */
  useEffect(() => {
    if (
      !receipt.isSuccess ||
      !receipt.data ||
      !hash ||
      processedHash.current === hash
    )
      return;
    processedHash.current = hash;
    newRound();
  }, [receipt.isSuccess, receipt.data, hash, newRound]);

  useEffect(() => {
    if (receipt.isError) {
      setPhase("idle");
      setHash(undefined);
    }
  }, [receipt.isError]);

  /* ── Pay and start (live mode) ── */
  const startLive = useCallback(async () => {
    setPhase("paying");
    try {
      const h = await scratch(zeroAddress);
      setHash(h);
      setPhase("waiting");
    } catch {
      setPhase("idle");
    }
  }, [scratch]);

  /* ── Demo start ── */
  const startDemo = useCallback(() => {
    newRound();
  }, [newRound]);

  const isBusy = isPending || phase === "paying" || phase === "waiting";

  /* ─── NOT CONNECTED ────────────────────────────────── */
  if (!isConnected || wrongChain) {
    return (
      <div className="space-y-6">
        {/* connect prompt */}
        <div className="border-3 border-black bg-white p-6 shadow-[var(--shadow-xl)] text-center space-y-4">
          <h2 className="font-head text-2xl font-black uppercase">
            {wrongChain ? "WRONG NETWORK" : "CONNECT TO PLAY"}
          </h2>
          <p className="font-sans text-sm text-muted-foreground">
            {wrongChain
              ? `Switch to ${configuredChain.name}.`
              : "Connect your wallet — or try the demo below."}
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>

        {/* demo game */}
        <GameBoard
          board={board}
          phase={phase}
          flipsLeft={flipsLeft}
          wins={wins}
          roundBest={roundBest}
          roundNum={roundNum}
          isDemo
          isBusy={false}
          mintFee={0n}
          sessionSpentWei={0n}
          error={null}
          onFlip={handleFlip}
          onStart={startDemo}
          onNewGame={newGame}
          nftCount={0n}
          scratchesToday={0n}
          streak={0n}
          statsLoading={false}
        />

        <ResultDialog
          type={dialogType}
          roundBest={roundBest}
          wins={wins}
          isDemo
          onNextRound={() => {
            setDialogType(null);
            newRound();
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

  /* ─── CONNECTED GAME ───────────────────────────────── */
  return (
    <div className="space-y-6">
      <GameBoard
        board={board}
        phase={phase}
        flipsLeft={flipsLeft}
        wins={wins}
        roundBest={roundBest}
        roundNum={roundNum}
        isDemo={isDemo}
        isBusy={isBusy}
        mintFee={mintFee}
        sessionSpentWei={sessionSpentWei}
        error={error}
        onFlip={handleFlip}
        onStart={isDemo ? startDemo : () => void startLive()}
        onNewGame={newGame}
        nftCount={nftCount}
        scratchesToday={scratchesToday}
        streak={streak}
        statsLoading={statsLoading}
      />

      <ResultDialog
        type={dialogType}
        roundBest={roundBest}
        wins={wins}
        isDemo={isDemo}
        onNextRound={() => {
          setDialogType(null);
          if (isDemo) {
            newRound();
          } else {
            setPhase("idle");
          }
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

/* ─── GAME BOARD COMPONENT ───────────────────────────── */

function GameBoard({
  board,
  phase,
  flipsLeft,
  wins,
  roundBest,
  roundNum,
  isDemo,
  isBusy,
  mintFee,
  sessionSpentWei,
  error,
  onFlip,
  onStart,
  onNewGame,
  nftCount,
  scratchesToday,
  streak,
  statsLoading,
}: {
  board: Tile[];
  phase: Phase;
  flipsLeft: number;
  wins: number;
  roundBest: number | null;
  roundNum: number;
  isDemo: boolean;
  isBusy: boolean;
  mintFee: bigint;
  sessionSpentWei: bigint;
  error: Error | null;
  onFlip: (i: number) => void;
  onStart: () => void;
  onNewGame: () => void;
  nftCount: bigint;
  scratchesToday: bigint;
  streak: bigint;
  statsLoading: boolean;
}) {
  const canFlip = phase === "playing" && flipsLeft > 0;

  return (
    <div
      className="border-[3px] border-black shadow-[var(--shadow-xl)] overflow-hidden"
      style={{ background: "#111" }}
    >
      {/* TOP HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-black px-4 py-3">
        <div className="flex items-center gap-3">
          <FlipsLeft count={flipsLeft} />
          {roundBest !== null && phase === "playing" && (
            <RoundBestDisplay best={roundBest} />
          )}
        </div>
        <WinProgress wins={wins} />
      </div>

      {/* ROUND LABEL */}
      <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 border-b border-[#333]">
        <span className="font-head text-xs tracking-[0.3em] text-white/40">
          {phase === "idle"
            ? "READY TO PLAY"
            : phase === "playing"
              ? `ROUND ${roundNum} — PICK ${TRIES} TILES`
              : phase === "paying"
                ? "CHECK WALLET..."
                : phase === "waiting"
                  ? "CONFIRMING ON-CHAIN..."
                  : phase === "nftWon"
                    ? "NFT WON!"
                    : "ROUND OVER"}
        </span>
        {isDemo && (
          <span className="font-sans text-[9px] font-bold tracking-widest text-primary/60">
            DEMO
          </span>
        )}
      </div>

      {/* THE GRID — 4 columns x 3 rows */}
      <div className="grid grid-cols-4 gap-2 p-4 sm:gap-3 sm:p-5">
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

      {/* BOTTOM ACTIONS */}
      <div className="space-y-3 border-t-2 border-black bg-white p-4">
        {/* idle / roundOver → start button */}
        {(phase === "idle" || phase === "roundOver") && (
          <RetroButton
            type="button"
            className="w-full text-base shadow-[var(--shadow-md)]"
            disabled={isBusy}
            onClick={onStart}
          >
            {phase === "roundOver"
              ? isDemo
                ? "NEXT ROUND (DEMO)"
                : "PAY & PLAY NEXT ROUND"
              : isDemo
                ? wins === 0
                  ? "START GAME (DEMO)"
                  : "CONTINUE (DEMO)"
                : wins === 0
                  ? `PAY ${mintFee > 0n ? formatEther(mintFee) + " CELO" : "..."} TO PLAY`
                  : `PAY & PLAY ROUND ${roundNum + 1}`}
          </RetroButton>
        )}

        {/* playing state guidance */}
        {phase === "playing" && (
          <p className="font-head text-center text-sm tracking-wider text-black animate-pulse">
            TAP {flipsLeft} TILE{flipsLeft !== 1 ? "S" : ""} — FIND EPIC OR
            LEGENDARY!
          </p>
        )}

        {/* paying / waiting */}
        {(phase === "paying" || phase === "waiting") && (
          <p className="font-head text-center text-sm tracking-wider text-black animate-pulse">
            {phase === "paying" ? "CHECK YOUR WALLET..." : "CONFIRMING ON-CHAIN..."}
          </p>
        )}

        {/* nft won */}
        {phase === "nftWon" && (
          <div className="space-y-2 text-center">
            <p className="font-head text-lg tracking-wider text-black">
              YOU WON AN NFT!
            </p>
            <RetroButton type="button" className="w-full" onClick={onNewGame}>
              PLAY AGAIN
            </RetroButton>
          </div>
        )}

        {/* cost / info */}
        {!isDemo && mintFee > 0n && phase === "idle" && (
          <p className="font-sans text-center text-xs text-muted-foreground">
            {formatEther(mintFee)} CELO per round — {TRIES} flips — find Epic+ to win
          </p>
        )}

        {isDemo && (
          <p className="font-sans text-center text-[10px] text-muted-foreground">
            Demo mode — deploy the contract to play for real NFTs
          </p>
        )}

        {sessionSpentWei > 0n && (
          <p className="font-sans text-center text-[10px] text-muted-foreground">
            Session: {formatEther(sessionSpentWei)} CELO spent
          </p>
        )}

        {error && (
          <p className="font-sans text-center text-xs font-bold text-destructive">
            Transaction failed. Try again.
          </p>
        )}
      </div>

      {/* PLAYER STATS BAR */}
      {!isDemo && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-muted px-4 py-2 font-sans text-xs">
          <span>
            NFTs:{" "}
            <strong>{statsLoading ? "..." : nftCount.toString()}</strong>
          </span>
          <span>
            Today:{" "}
            <strong>
              {statsLoading
                ? "..."
                : `${scratchesToday.toString()} / 5`}
            </strong>
          </span>
          <span className="flex items-center gap-1">
            Streak:{" "}
            <strong>{statsLoading ? "..." : streak.toString()}</strong>
            {streak >= 2n && (
              <span
                className="inline-block h-3 w-2.5 bg-orange-500"
                style={{
                  clipPath:
                    "polygon(50% 0%, 100% 65%, 75% 100%, 50% 85%, 25% 100%, 0% 65%)",
                }}
              />
            )}
            {streak >= 3n && (
              <span className="text-[9px] font-black text-[#00c853]">
                2x LEG
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── RESULT DIALOG ──────────────────────────────────── */

function ResultDialog({
  type,
  roundBest,
  wins,
  isDemo,
  onNextRound,
  onNewGame,
  onClose,
}: {
  type: "roundWin" | "roundLoss" | "nftWon" | null;
  roundBest: number | null;
  wins: number;
  isDemo: boolean;
  onNextRound: () => void;
  onNewGame: () => void;
  onClose: () => void;
}) {
  if (!type) return null;

  return (
    <>
      {/* ROUND WIN */}
      <RetroDialog open={type === "roundWin"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>
            {roundBest === 3
              ? "LEGENDARY FIND!"
              : "EPIC! YOU FOUND IT!"}
          </RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              Best tile this round:{" "}
              <strong>{roundBest !== null ? rarityLabel(roundBest) : ""}</strong>
            </p>
            <p>
              Progress:{" "}
              <strong>
                {wins} / {WINS_NEEDED}
              </strong>{" "}
              wins
              {wins >= WINS_NEEDED ? " — NFT UNLOCKED!" : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {WINS_NEEDED - wins > 0
                ? `${WINS_NEEDED - wins} more win${WINS_NEEDED - wins > 1 ? "s" : ""} to mint your NFT`
                : "You did it!"}
            </p>
          </RetroDialogDescription>
          <RetroDialogClose
            type="button"
            className="w-full mt-3"
            onClick={onNextRound}
          >
            NEXT ROUND
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>

      {/* ROUND LOSS */}
      <RetroDialog open={type === "roundLoss"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>NO EPIC THIS TIME</RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              Best tile:{" "}
              <strong>{roundBest !== null ? rarityLabel(roundBest) : "COMMON"}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              You need to find an Epic or Legendary in your 3 flips to score a
              win. Come back daily to build streak — 3-day streak doubles
              Legendary odds.
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

      {/* NFT WON */}
      <RetroDialog open={type === "nftWon"} onOpenChange={() => onClose()}>
        <RetroDialogContent>
          <RetroDialogTitle>
            NFT UNLOCKED!
          </RetroDialogTitle>
          <RetroDialogDescription className="font-sans text-foreground mt-3 space-y-2">
            <p>
              You hit {WINS_NEEDED} wins!{" "}
              {isDemo
                ? "Deploy the contract to mint real NFTs."
                : "Your NFT has been minted on-chain."}
            </p>
            <p className="text-sm text-muted-foreground">
              Keep playing every day to stay eligible for the weekly prize pool.
              Legendary NFT holders with active streaks get the biggest share.
            </p>
          </RetroDialogDescription>
          {!isDemo && (
            <RetroButton
              type="button"
              className="w-full mt-2"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `Just won an NFT on Loot Scratch! 3 Epic finds in a row. Try your luck: ${typeof window !== "undefined" ? window.location.origin : ""}`
                  )}`,
                  "_blank"
                )
              }
            >
              SHARE ON X
            </RetroButton>
          )}
          <RetroDialogClose
            type="button"
            className="w-full mt-2"
            onClick={onNewGame}
          >
            PLAY AGAIN
          </RetroDialogClose>
        </RetroDialogContent>
      </RetroDialog>
    </>
  );
}
