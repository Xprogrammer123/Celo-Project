import { ScratchGame } from "@/components/scratch-card/scratch-game";
import { RovaWallet } from "@/components/game/rova-wallet";
import { ROVA_PER_CELO, ROVA_PER_GAME } from "@/constants/rova";

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b-2 border-[#333] bg-black px-4 py-5 text-center">
        <h1 className="font-head text-3xl font-black uppercase tracking-[0.15em] text-primary md:text-4xl">
          ROVA MEMORY
        </h1>
        <p className="font-sans mt-1 text-xs tracking-widest text-white/30">
          FIND 2 EPIC CARDS IN 3 TRIALS &bull; WIN 3 IN A ROW &bull; MINT NFT
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <ScratchGame />

          <aside className="space-y-4 lg:sticky lg:top-20">
            <RovaWallet />

            <div className="border-2 border-[#333] bg-[#111] p-4 text-white">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
                HOW IT CONNECTS
              </h3>
              <div className="font-sans space-y-3 text-xs text-white/60">
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-white block mb-1">
                    1 — The board
                  </strong>
                  4×3 face-down cards. Two Epic cards are shuffled in among 10
                  decoys. Board reshuffles every new game.
                </div>
                <div className="border-l-2 border-[#7e22ce] pl-3">
                  <strong className="text-white block mb-1">
                    2 — 3 trials
                  </strong>
                  Each trial is 2 picks. If the pair is different, both cards
                  close back face-down. Match both Epics within 3 trials to win.
                </div>
                <div className="border-l-2 border-[#00c853] pl-3">
                  <strong className="text-white block mb-1">
                    3 — Win streak
                  </strong>
                  Win 3 rounds in a row with zero losses to mint an NFT. Lose
                  once — even at 2/3 — streak resets to 0.
                </div>
              </div>
            </div>

            <div className="border-2 border-[#333] bg-[#111] p-4 text-white">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
                BOARD (4×3)
              </h3>
              <div className="space-y-2 font-sans text-xs">
                {[
                  { label: "COMMON (decoy)", count: 6, bg: "#bbb", fg: "#333" },
                  { label: "RARE (decoy)", count: 4, bg: "#ffdb33", fg: "#000" },
                  {
                    label: "EPIC (target)",
                    count: 2,
                    bg: "#7e22ce",
                    fg: "#fff",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="border-2 px-2 py-0.5 font-bold tracking-wider"
                      style={{ background: r.bg, color: r.fg, borderColor: "#000" }}
                    >
                      {r.label}
                    </span>
                    <span className="text-white/40">{r.count} cards</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-white/25">
                Pick 2 cards per trial. Mismatched cards close back for memory.
              </p>
            </div>

            <div className="border-2 border-[#ffd700] bg-black p-4">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-[#ffd700] mb-3">
                ROVA ECONOMY
              </h3>
              <ul className="font-sans space-y-1.5 text-xs text-white/60">
                <li>
                  <strong className="text-white">1 CELO</strong> →{" "}
                  {ROVA_PER_CELO} ROVA
                </li>
                <li>
                  <strong className="text-white">1 game</strong> →{" "}
                  {ROVA_PER_GAME} ROVA
                </li>
                <li>
                  <strong className="text-[#ffd700]">
                    {ROVA_PER_CELO / ROVA_PER_GAME} games
                  </strong>{" "}
                  per CELO pack
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
