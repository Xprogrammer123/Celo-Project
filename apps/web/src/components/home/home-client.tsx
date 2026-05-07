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

/* ────────────────────────────────────────────────────────
   FIXED GRID BACKGROUND
──────────────────────────────────────────────────────── */
function RetroBackground() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#000" strokeWidth="0.4" opacity="0.1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────
   SVG CHARACTER CARDS
──────────────────────────────────────────────────────── */

/** Card 1: Scratch Demon — holds a scratch card, horns, grin */
function ScratchDemonCard() {
  return (
    <div
      className="card-bob cb1"
      style={{
        width: 155,
        border: "3px solid #000",
        background: "#ffdb33",
        boxShadow: "7px 7px 0 0 #000",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 155 200" xmlns="http://www.w3.org/2000/svg" width="155" height="200">
        <defs>
          <pattern id="chk" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#ffd000" />
            <rect x="10" y="10" width="10" height="10" fill="#ffd000" />
            <rect x="10" y="0" width="10" height="10" fill="#ffdb33" />
            <rect x="0" y="10" width="10" height="10" fill="#ffdb33" />
          </pattern>
        </defs>
        {/* bg */}
        <rect width="155" height="200" fill="url(#chk)" />
        {/* horns */}
        <polygon points="50,54 40,24 64,46" fill="#000" />
        <polygon points="105,54 115,24 91,46" fill="#000" />
        {/* head */}
        <rect x="36" y="50" width="83" height="58" fill="#ffdb33" stroke="#000" strokeWidth="2.5" />
        {/* eyes */}
        <rect x="46" y="62" width="22" height="20" fill="#fff" stroke="#000" strokeWidth="2" />
        <rect x="87" y="62" width="22" height="20" fill="#fff" stroke="#000" strokeWidth="2" />
        <rect x="53" y="66" width="9" height="12" fill="#000" />
        <rect x="94" y="66" width="9" height="12" fill="#000" />
        <rect x="60" y="67" width="3" height="3" fill="#fff" />
        <rect x="101" y="67" width="3" height="3" fill="#fff" />
        {/* grin */}
        <rect x="54" y="90" width="47" height="7" fill="#000" />
        <rect x="57" y="90" width="8" height="11" fill="#ffdb33" />
        <rect x="90" y="90" width="8" height="11" fill="#ffdb33" />
        {/* body */}
        <rect x="44" y="106" width="67" height="62" fill="#000" />
        {/* scratch card in left hand */}
        <rect x="10" y="108" width="34" height="48" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <line x1="14" y1="120" x2="40" y2="120" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4 2" />
        <rect x="14" y="126" width="26" height="5" fill="#ffdb33" />
        <text x="18" y="131" fontSize="9" fill="#000" fontFamily="monospace" fontWeight="bold">★★★</text>
        <line x1="14" y1="136" x2="40" y2="136" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="14" y1="143" x2="40" y2="143" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4 2" />
        {/* arm */}
        <rect x="10" y="106" width="34" height="12" fill="#000" />
        {/* right arm */}
        <rect x="111" y="106" width="34" height="12" fill="#000" />
        <circle cx="128" cy="126" r="12" fill="#ffdb33" stroke="#000" strokeWidth="2.5" />
        <text x="128" y="131" textAnchor="middle" fontSize="14" fill="#000">✦</text>
        {/* legs */}
        <rect x="54" y="166" width="18" height="24" fill="#000" />
        <rect x="83" y="166" width="18" height="24" fill="#000" />
        <rect x="48" y="182" width="28" height="10" fill="#ffdb33" stroke="#000" strokeWidth="2" />
        <rect x="79" y="182" width="28" height="10" fill="#ffdb33" stroke="#000" strokeWidth="2" />
        {/* label bar */}
        <rect x="0" y="188" width="155" height="12" fill="#000" />
        <text x="77" y="198" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffdb33" fontFamily="monospace" letterSpacing="2">SCRATCH DEMON</text>
      </svg>
    </div>
  );
}

/** Card 2: Lucky Coin — big round face, $, always grinning */
function LuckyCoinCard() {
  return (
    <div
      className="card-bob cb2"
      style={{
        width: 155,
        border: "3px solid #000",
        background: "#fff",
        boxShadow: "7px 7px 0 0 #000",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 155 200" xmlns="http://www.w3.org/2000/svg" width="155" height="200">
        <defs>
          <pattern id="zz" x="0" y="0" width="20" height="10" patternUnits="userSpaceOnUse">
            <polyline points="0,10 10,0 20,10" fill="none" stroke="#e8e8e8" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="155" height="200" fill="url(#zz)" />
        {/* coin */}
        <circle cx="77" cy="96" r="60" fill="#ffdb33" stroke="#000" strokeWidth="3" />
        <circle cx="77" cy="96" r="50" fill="none" stroke="#000" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.25" />
        {/* $ */}
        <text x="77" y="58" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#000" fontFamily="monospace">$</text>
        {/* eyes */}
        <ellipse cx="60" cy="84" rx="13" ry="15" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <ellipse cx="94" cy="84" rx="13" ry="15" fill="#fff" stroke="#000" strokeWidth="2.5" />
        <ellipse cx="62" cy="86" rx="6" ry="7" fill="#000" />
        <ellipse cx="96" cy="86" rx="6" ry="7" fill="#000" />
        <circle cx="64" cy="83" r="2" fill="#fff" />
        <circle cx="98" cy="83" r="2" fill="#fff" />
        {/* grin */}
        <path d="M 53 108 Q 77 130 101 108" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" />
        <line x1="53"  y1="108" x2="53"  y2="114" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="101" y1="108" x2="101" y2="114" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        {/* side hands */}
        <circle cx="18"  cy="96" r="13" fill="#ffdb33" stroke="#000" strokeWidth="2.5" />
        <text x="18"  y="101" textAnchor="middle" fontSize="13" fill="#000">✦</text>
        <circle cx="136" cy="96" r="13" fill="#ffdb33" stroke="#000" strokeWidth="2.5" />
        <text x="136" y="101" textAnchor="middle" fontSize="13" fill="#000">✦</text>
        {/* legs */}
        <rect x="57" y="153" width="16" height="26" fill="#ffdb33" stroke="#000" strokeWidth="2.5" />
        <rect x="82" y="153" width="16" height="26" fill="#ffdb33" stroke="#000" strokeWidth="2.5" />
        <rect x="50" y="170" width="26" height="11" fill="#000" />
        <rect x="79" y="170" width="26" height="11" fill="#000" />
        {/* label */}
        <rect x="0" y="188" width="155" height="12" fill="#000" />
        <text x="77" y="198" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ffdb33" fontFamily="monospace" letterSpacing="3">LUCKY COIN</text>
      </svg>
    </div>
  );
}

/** Card 3: The Legend — ghost with crown, black bg, gold glow */
function LegendCard() {
  return (
    <div
      className="card-bob cb3"
      style={{
        width: 155,
        border: "3px solid #000",
        background: "#0a0a0a",
        boxShadow: "7px 7px 0 0 #ffdb33",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 155 200" xmlns="http://www.w3.org/2000/svg" width="155" height="200">
        <defs>
          <pattern id="dts" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="1.2" fill="#1a1a1a" />
          </pattern>
        </defs>
        <rect width="155" height="200" fill="url(#dts)" />
        {/* legendary badge top */}
        <rect x="12" y="8" width="131" height="18" fill="#ffdb33" />
        <text x="77" y="21" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#000" fontFamily="monospace" letterSpacing="2">★ LEGENDARY ★</text>
        {/* ghost body */}
        <rect x="28" y="66" width="99" height="82" fill="#ffdb33" />
        {/* rounded top */}
        <ellipse cx="77" cy="66" rx="49" ry="24" fill="#ffdb33" />
        {/* wavy bottom */}
        <rect x="28" y="126" width="99" height="22" fill="#ffdb33" />
        <ellipse cx="44"  cy="150" rx="11" ry="10" fill="#0a0a0a" />
        <ellipse cx="66"  cy="146" rx="11" ry="10" fill="#ffdb33" />
        <ellipse cx="88"  cy="150" rx="11" ry="10" fill="#0a0a0a" />
        <ellipse cx="110" cy="146" rx="11" ry="10" fill="#ffdb33" />
        <ellipse cx="126" cy="150" rx="11" ry="10" fill="#0a0a0a" />
        {/* eyes */}
        <ellipse cx="60" cy="92" rx="15" ry="18" fill="#0a0a0a" />
        <ellipse cx="94" cy="92" rx="15" ry="18" fill="#0a0a0a" />
        <ellipse cx="62" cy="89" rx="5"  ry="7"  fill="#fff" />
        <ellipse cx="96" cy="89" rx="5"  ry="7"  fill="#fff" />
        {/* crown */}
        <polygon points="40,66 50,38 62,58 77,32 92,58 104,38 115,66" fill="#ffdb33" stroke="#0a0a0a" strokeWidth="2" />
        <circle cx="50"  cy="38" r="4" fill="#0a0a0a" />
        <circle cx="77"  cy="32" r="5" fill="#0a0a0a" />
        <circle cx="104" cy="38" r="4" fill="#0a0a0a" />
        {/* sparkles */}
        <text x="12"  y="86" fontSize="14" fill="#ffdb33" fontFamily="serif">✦</text>
        <text x="132" y="76" fontSize="10" fill="#ffdb33" fontFamily="serif">✦</text>
        <text x="138" y="105" fontSize="7" fill="#ffdb33" fontFamily="serif">✦</text>
        {/* label */}
        <rect x="0" y="188" width="155" height="12" fill="#ffdb33" />
        <text x="77" y="198" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#000" fontFamily="monospace" letterSpacing="2">THE LEGEND</text>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   FLOATING STAR SVG
──────────────────────────────────────────────────────── */
function FloatingStar({
  size = 28,
  delay = "0s",
  fill = "#ffdb33",
}: {
  size?: number;
  delay?: string;
  fill?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ animation: `starFloat 3.5s ease-in-out infinite`, animationDelay: delay }}
    >
      <polygon
        points="16,2 19,11 29,11 21,17 24,26 16,20 8,26 11,17 3,11 13,11"
        fill={fill}
        stroke="#000"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────
   STAT BLOCK
──────────────────────────────────────────────────────── */
function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-2 border-black bg-white px-4 py-3 text-center shadow-[4px_4px_0_0_#000]">
      <div className="font-head text-2xl tabular-nums">{value}</div>
      <div className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   HOME CLIENT
──────────────────────────────────────────────────────── */
export function HomeClient() {
  const { totalScratches, totalNfts, totalPlayers, isLoading } =
    usePlayerStats();

  const fmt = (n: bigint) =>
    n >= 100000n ? `${(Number(n) / 1000).toFixed(0)}k` : n.toString();

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fffef5]">
      <RetroBackground />

      {/* win ticker */}
      <WinTicker className="fixed left-0 right-0 top-0 z-20" />

    

      {/* HERO SECTION */}
      <section className="relative z-10 mx-auto flex max-w-7xl flex-col-reverse items-center gap-12 px-8 py-16 md:flex-row md:items-center md:justify-between">

        {/* LEFT — text */}
        <div className="max-w-[480px]">
          {/* tier pills */}
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              { label: "60% Common",    bg: "#e5e5e5", fg: "#555" },
              { label: "25% Rare",      bg: "#ffdb33", fg: "#000" },
              { label: "12% Epic",      bg: "#c084fc", fg: "#000" },
              { label: "3% Legendary",  bg: "#000",    fg: "#ffdb33" },
            ].map(({ label, bg, fg }) => (
              <span
                key={label}
                className="font-sans border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_0_#000]"
                style={{ background: bg, color: fg }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* big title */}
          <div style={{ transform: "rotate(-2deg)", transformOrigin: "left center" }}>
            <h1 className="font-head text-[80px] font-black uppercase leading-[0.88] tracking-tighter text-black md:text-[100px]">
              ROVA
            </h1>
            <div
              className="mt-1 inline-block border-4 border-black bg-[#ffdb33] px-3 py-0.5 shadow-[6px_6px_0_0_#000]"
              style={{ transform: "rotate(1deg)" }}
            >
              <span className="font-head text-[48px] font-black uppercase leading-none tracking-tight text-black md:text-[60px]">
                IS NOW!
              </span>
            </div>
          </div>

          <p className="font-sans mt-7 max-w-sm text-base font-medium leading-relaxed text-black/55">
            Provably fair on-chain scratch cards powered by Chainlink VRF.
            No house tricks. Every result lives on Base Sepolia — forever.
          </p>

          <div className="mt-8 flex items-center gap-5">
            <Link href="/play">
              <RetroButton
                size="lg"
                className="font-head text-base tracking-wider shadow-[5px_5px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
              >
                ★ SCRATCH NOW
              </RetroButton>
            </Link>
          </div>

          {/* stat counters */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            <StatBlock label="Scratches" value={isLoading ? "…" : fmt(totalScratches)} />
            <StatBlock label="Minted"    value={isLoading ? "…" : fmt(totalNfts)} />
            <StatBlock label="Players"   value={isLoading ? "…" : fmt(totalPlayers)} />
          </div>
        </div>

        {/* RIGHT — character cards with stars */}
        <div className="relative flex items-end gap-4 md:gap-5">
          {/* floating stars scattered around cards */}
          <div className="absolute -left-8 top-4">
            <FloatingStar size={32} delay="0s" />
          </div>
          <div className="absolute -right-6 top-12">
            <FloatingStar size={24} delay="0.7s" />
          </div>
          <div className="absolute right-20 -top-8">
            <FloatingStar size={20} delay="1.4s" fill="#000" />
          </div>
          <div className="absolute -left-4 bottom-8">
            <FloatingStar size={18} delay="2.1s" fill="#000" />
          </div>
          <div className="absolute -right-2 bottom-20">
            <FloatingStar size={26} delay="0.4s" />
          </div>

          <ScratchDemonCard />
          <LuckyCoinCard />
          <LegendCard />
        </div>
      </section>

      {/* BOTTOM STRIP — yellow bar like reference bottom */}
      <div className="relative z-10 border-t-2 border-black bg-[#ffdb33] px-10 py-3 flex items-center justify-between">
        <span className="font-head text-[11px] font-black uppercase tracking-[0.2em] text-black">
          on-chain · provably fair · base sepolia
        </span>
        <div className="flex gap-3">
          {["𝕏", "▶", "◆"].map((icon, i) => (
            <span
              key={i}
              className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white font-bold text-black shadow-[2px_2px_0_0_#000] cursor-pointer hover:bg-black hover:text-[#ffdb33] transition-colors text-sm"
            >
              {icon}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes starFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-10px) rotate(12deg); }
        }
        @keyframes cardBob {
          0%,100% { transform: rotate(var(--r, 0deg)) translateY(0px); }
          50%      { transform: rotate(var(--r, 0deg)) translateY(-10px); }
        }
        .card-bob { animation: cardBob 4s ease-in-out infinite; }
        .cb1 { --r: -4deg; animation-delay: 0s; }
        .cb2 { --r:  3deg; animation-delay: 0.8s; }
        .cb3 { --r: -2deg; animation-delay: 1.6s; }
      `}</style>
    </main>
  );
}