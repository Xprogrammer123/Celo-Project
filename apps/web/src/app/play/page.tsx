import { ScratchGame } from "@/components/scratch-card/scratch-game";

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* game header */}
      <div className="border-b-2 border-[#333] bg-black px-4 py-5 text-center">
        <h1 className="font-head text-3xl font-black uppercase tracking-[0.15em] text-primary md:text-4xl">
          LOOT SCRATCH
        </h1>
        <p className="font-sans mt-1 text-xs tracking-widest text-white/30">
          FIND EPIC OR LEGENDARY IN 3 FLIPS &bull; WIN 3 ROUNDS &bull; MINT NFT
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          {/* game — takes up most of the space */}
          <ScratchGame />

          {/* sidebar — rules + daily engagement */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            {/* how to play */}
            <div className="border-2 border-[#333] bg-[#111] p-4 text-white">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
                HOW TO PLAY
              </h3>
              <ol className="font-sans space-y-2 text-xs text-white/60 list-decimal list-inside">
                <li>
                  Pay <strong className="text-white">1 CELO</strong> to start a
                  round
                </li>
                <li>
                  You get <strong className="text-white">3 tile flips</strong>{" "}
                  on a 4x3 board
                </li>
                <li>
                  Find an{" "}
                  <strong className="text-[#a855f7]">Epic</strong> or{" "}
                  <strong className="text-[#ffd700]">Legendary</strong> tile to
                  score a win
                </li>
                <li>
                  Score{" "}
                  <strong className="text-[#00c853]">3 wins</strong> to mint
                  your NFT
                </li>
              </ol>
            </div>

            {/* tile distribution */}
            <div className="border-2 border-[#333] bg-[#111] p-4 text-white">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
                BOARD TILES (12 TOTAL)
              </h3>
              <div className="space-y-2 font-sans text-xs">
                {[
                  { label: "COMMON", count: 6, bg: "#bbb", fg: "#333" },
                  { label: "RARE", count: 3, bg: "#ffdb33", fg: "#000" },
                  { label: "EPIC", count: 2, bg: "#7e22ce", fg: "#fff" },
                  { label: "LEGENDARY", count: 1, bg: "#0a0a0a", fg: "#ffd700", border: "#ffd700" },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span
                      className="border-2 px-2 py-0.5 font-bold tracking-wider"
                      style={{
                        background: r.bg,
                        color: r.fg,
                        borderColor: r.border ?? "#000",
                      }}
                    >
                      {r.label}
                    </span>
                    <span className="text-white/40">{r.count} tiles</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-white/25">
                Board reshuffles every round. Only Epic+ counts as a win.
              </p>
            </div>

            {/* daily prizes */}
            <div className="border-2 border-[#ffd700] bg-black p-4">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-[#ffd700] mb-3">
                DAILY PRIZES
              </h3>
              <ul className="font-sans space-y-1.5 text-xs text-white/60">
                <li>
                  <strong className="text-white">5 rounds/day</strong> — max per
                  wallet
                </li>
                <li>
                  <strong className="text-[#ffd700]">3-day streak</strong> — 2x
                  Legendary tile odds
                </li>
                <li>
                  <strong className="text-[#00c853]">5-day streak</strong> —
                  weekly prize pool eligible
                </li>
                <li>
                  <strong className="text-[#a855f7]">7-day streak</strong> —
                  Hall of Fame + bonus
                </li>
              </ul>
              <p className="mt-3 font-sans text-[10px] text-white/30">
                Consistency wins. Play every day, build your streak, earn real
                prizes at the end of each week.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
