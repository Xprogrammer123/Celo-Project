"use client";

import Link from "next/link";
import {
  CELO_PER_GAME,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
} from "@/constants/rova";
import { isContractConfigured } from "@/constants/contract";
import { usePlayerStats } from "@/hooks/usePlayerStats";
import {
  NFT_SHOWCASE,
  NFT_PRIZE_PREVIEW,
  nftPreviewImage,
} from "@/lib/nft-preview-art";
import { RetroButton } from "@/components/retroui/button";
import { RetroBadge } from "@/components/retroui/badge";

const TICKER = [
  "★ MATCH THE NFT ★",
  "3 TRIALS ONLY",
  "LOSE ONCE = STREAK GONE",
  "0.25 CELO PER GAME",
  "DEMO IS FREE",
  "ON-CHAIN CELO",
  "3 WINS = MINT",
];

function RetroBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full opacity-50"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="home-grid"
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 36 0 L 0 0 0 36"
            fill="none"
            stroke="#000"
            strokeWidth="0.5"
            opacity="0.07"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#home-grid)" />
    </svg>
  );
}

function MarqueeTicker() {
  const line = [...TICKER, ...TICKER];
  return (
    <div className="relative z-20 overflow-hidden border-y-2 border-black bg-secondary py-2">
      <div className="animate-home-marquee flex w-max gap-8 whitespace-nowrap">
        {line.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="font-head text-xs font-black uppercase tracking-[0.25em] text-secondary-foreground"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function NftCard({
  rarity,
  label,
  tokenId,
  uid,
  size = "md",
  tilt = 0,
}: {
  rarity: 0 | 1 | 2 | 3;
  label: string;
  tokenId: number;
  uid: string;
  size?: "sm" | "md" | "lg";
  tilt?: number;
}) {
  const variants = {
    sm: "w-28",
    md: "w-40 md:w-48",
    lg: "w-52 md:w-64",
  };
  const badgeVariant = ["common", "rare", "epic", "legendary"] as const;

  return (
    <div
      className={`${variants[size]} shrink-0 transition-transform hover:scale-105 hover:-translate-y-1`}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div
        className="border-[3px] border-black bg-card overflow-hidden shadow-[var(--shadow-xl)]"
        style={{
          boxShadow:
            rarity === 3
              ? "8px 8px 0 0 #000, 0 0 28px rgba(255,215,0,0.45)"
              : rarity === 2
                ? "8px 8px 0 0 #000, 0 0 18px rgba(156,39,176,0.35)"
                : "8px 8px 0 0 #000",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={nftPreviewImage(rarity, tokenId, uid)}
          alt={`${label} NFT #${tokenId}`}
          className="aspect-square w-full object-cover"
        />
        <div className="flex items-center justify-between border-t-2 border-black bg-black px-2 py-1.5">
          <RetroBadge variant={badgeVariant[rarity]} className="text-[9px]">
            {label}
          </RetroBadge>
          <span className="font-mono text-[10px] text-primary">#{tokenId}</span>
        </div>
      </div>
    </div>
  );
}

function BoardPreview() {
  const tiles: Array<"?" | "rova" | "nft"> = [
    "?", "rova", "?", "?",
    "?", "?", "nft", "rova",
    "?", "nft", "?", "?",
  ];

  return (
    <div className="border-[3px] border-black bg-primary p-4 shadow-[var(--shadow-xl)] animate-home-wiggle">
      <p className="font-head text-center text-[11px] font-black uppercase tracking-[0.35em] mb-3">
        ★ live board ★
      </p>
      <div className="grid grid-cols-4 gap-1.5 max-w-[280px] mx-auto">
        {tiles.map((t, i) => (
          <div
            key={i}
            className="aspect-square border-2 border-black overflow-hidden flex items-center justify-center"
            style={{
              background: t === "nft" ? "#0a0a0a" : "#fffef5",
            }}
          >
            {t === "?" && (
              <span className="font-head text-xl text-black/25">?</span>
            )}
            {t === "rova" && (
              <img src="/logo.png" alt="" className="h-[70%] w-[70%] object-contain" />
            )}
            {t === "nft" && (
              <img
                src={NFT_PRIZE_PREVIEW}
                alt="NFT prize"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        ))}
      </div>
      <p className="font-head text-center text-[10px] uppercase mt-2 tracking-widest">
        find both NFT prizes → win
      </p>
    </div>
  );
}

export function HomeClient() {
  const { totalScratches, totalNfts, totalPlayers, isLoading } =
    usePlayerStats();

  const fmt = (n: bigint) =>
    n >= 1000n ? `${(Number(n) / 1000).toFixed(1)}k` : n.toString();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <RetroBackground />
      <MarqueeTicker />

      {/* HERO */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div
              className="inline-block border-4 border-black bg-primary px-4 py-1 shadow-[6px_6px_0_0_#000] mb-4 animate-home-wiggle"
              style={{ transform: "rotate(-2deg)" }}
            >
              <span className="font-head text-sm font-black uppercase tracking-[0.2em]">
                memory game · celo · nft mint
              </span>
            </div>

            <h1 className="font-head text-[clamp(3rem,12vw,6.5rem)] font-black uppercase leading-[0.85] tracking-tighter">
              MATCH
              <span className="block text-primary [-webkit-text-stroke:3px_#000]">
                THE NFT
              </span>
            </h1>

            <p className="font-sans mt-5 text-lg font-medium leading-snug max-w-md">
              Flip. Remember. Sweat.{" "}
              <span className="bg-primary px-1 border-2 border-black">
                3 wins in a row
              </span>{" "}
              and the chain mints your loot. One bad round? Streak deleted. Gone.
              Zero mercy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/play">
                <RetroButton size="lg" className="text-base shadow-[var(--shadow-xl)]">
                  ★ PLAY FOR REAL
                </RetroButton>
              </Link>
              <Link href="/play">
                <RetroButton size="lg" variant="outline">
                  FREE DEMO
                </RetroButton>
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2">
              {[
                {
                  label: isContractConfigured ? "Plays" : "Chain",
                  val: isContractConfigured
                    ? isLoading
                      ? "…"
                      : fmt(totalScratches)
                    : "CELO",
                },
                {
                  label: isContractConfigured ? "Minted" : "Cost",
                  val: isContractConfigured
                    ? isLoading
                      ? "…"
                      : fmt(totalNfts)
                    : CELO_PER_GAME,
                },
                {
                  label: isContractConfigured ? "Degens" : "Streak",
                  val: isContractConfigured
                    ? isLoading
                      ? "…"
                      : fmt(totalPlayers)
                    : "3",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border-2 border-black bg-card py-3 text-center shadow-[var(--shadow-md)]"
                >
                  <p className="font-head text-2xl">{s.val}</p>
                  <p className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-6 lg:w-[48%]">
            <BoardPreview />
            <div className="absolute -left-4 top-8 hidden lg:block animate-home-float">
              <NftCard rarity={3} label="LEGENDARY" tokenId={1} uid="h1" size="sm" tilt={-8} />
            </div>
            <div
              className="absolute -right-2 bottom-4 hidden lg:block animate-home-float"
              style={{ animationDelay: "1s" }}
            >
              <NftCard rarity={2} label="EPIC" tokenId={88} uid="h2" size="sm" tilt={6} />
            </div>
          </div>
        </div>
      </section>

      {/* REAL NFT COLLECTION — on-chain art */}
      <section className="relative z-10 border-y-2 border-black bg-muted py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-8 text-center md:text-left">
            <h2 className="font-head text-3xl md:text-5xl font-black uppercase tracking-tight">
              Real on-chain NFT art
            </h2>
            <p className="font-sans mt-2 text-muted-foreground max-w-xl">
              Every mint is a unique SVG stored on Celo — same art you chase on
              the board. Common to Legendary. No fakes. No PNGs glued on.
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:justify-center md:overflow-visible md:flex-wrap">
            {NFT_SHOWCASE.map((n, i) => (
              <div key={n.label} className="snap-center">
                <NftCard
                  rarity={n.id}
                  label={n.label}
                  tokenId={n.tokenId}
                  uid={`show-${i}`}
                  size="lg"
                  tilt={i % 2 === 0 ? -3 : 3}
                />
              </div>
            ))}
          </div>

          <p className="font-head text-center text-xs uppercase tracking-[0.3em] mt-6 text-muted-foreground">
            ↑ these are the actual contract designs ↑
          </p>
        </div>
      </section>

      {/* HOW TO PLAY — arcade style */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-14 md:px-8">
        <h2 className="font-head text-4xl font-black uppercase text-center mb-10 md:text-5xl">
          How you win (or cry)
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "Shuffle & hunt",
              body: "4×3 board. 10 ROVA decoys. 2 real NFT prize cards hiding. Every game reshuffles. Your brain is the weapon.",
              bg: "bg-primary",
              img: NFT_PRIZE_PREVIEW,
            },
            {
              n: "02",
              title: "3 trials only",
              body: "Pick 2 cards per trial. Wrong pair? They slam shut face-down. Epic + random? Still shuts. Remember everything.",
              bg: "bg-[#7e22ce] text-white",
              img: nftPreviewImage(2, 42, "s2"),
            },
            {
              n: "03",
              title: "3/3 or bust",
              body: "Win 3 rounds straight → NFT minted to your wallet. Lose once at 2/3? Back to 0/3. Maximum pain. Maximum hype.",
              bg: "bg-black text-[#ffd700]",
              img: nftPreviewImage(3, 1, "s3"),
            },
          ].map((step) => (
            <div
              key={step.n}
              className="border-[3px] border-black bg-card overflow-hidden shadow-[var(--shadow-xl)] hover:-translate-y-1 transition-transform"
            >
              <div className="relative aspect-[4/3] border-b-2 border-black overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.img}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span
                  className={`absolute top-2 left-2 font-head text-4xl font-black px-2 border-2 border-black ${step.bg}`}
                >
                  {step.n}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-head text-xl uppercase mb-2">{step.title}</h3>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRIZE SPOTLIGHT */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-14 md:px-8">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="flex justify-center gap-4">
            <NftCard rarity={3} label="LEGENDARY" tokenId={1} uid="spot1" size="lg" tilt={-5} />
            <NftCard rarity={2} label="EPIC PRIZE" tokenId={88} uid="spot2" size="lg" tilt={4} />
          </div>
          <div className="border-[3px] border-black bg-primary p-8 shadow-[var(--shadow-xl)]">
            <h3 className="font-head text-3xl font-black uppercase mb-4">
              What you&apos;re matching
            </h3>
            <p className="font-sans text-base mb-6">
              On the board you&apos;re not hunting “Epic” text — you&apos;re
              hunting <strong>real NFT prize tiles</strong> that look exactly
              like the on-chain mints above. Match both in 3 trials. Do it 3
              times without choking. Mint.
            </p>
            <ul className="font-sans space-y-2 text-sm mb-6">
              <li>★ {ROVA_PER_GAME} ROVA per game ({CELO_PER_GAME} CELO)</li>
              <li>★ Demo mode — practice free, no mint</li>
              <li>★ Leaderboard with your custom username</li>
            </ul>
            <Link href="/play">
              <RetroButton size="lg" variant="secondary" className="w-full md:w-auto">
                ENTER THE ARENA →
              </RetroButton>
            </Link>
          </div>
        </div>
      </section>

      <MarqueeTicker />

      {/* FOOTER */}
      <footer className="relative z-10 border-t-2 border-border bg-card px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ROVA"
              className="h-12 w-12 border-2 border-black bg-primary p-1"
            />
            <div>
              <span className="font-head text-2xl font-black uppercase">ROVA</span>
              <p className="font-sans text-[10px] text-muted-foreground">
                Memory · Celo · NFT
              </p>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 font-head text-sm uppercase">
            <Link href="/play" className="hover:bg-primary hover:px-2 transition-all">
              Play
            </Link>
            <Link href="/leaderboard" className="hover:bg-primary hover:px-2 transition-all">
              Leaderboard
            </Link>
            <Link href="/gallery" className="hover:bg-primary hover:px-2 transition-all">
              Gallery
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
