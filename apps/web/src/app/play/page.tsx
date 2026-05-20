import { ScratchGame } from "@/components/scratch-card/scratch-game";
import { RovaWallet } from "@/components/game/rova-wallet";
import { ROVA_PER_CELO, ROVA_PER_GAME } from "@/constants/rova";

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-2 border-border bg-card px-4 py-5 text-center">
        <h1 className="font-head text-3xl font-black uppercase tracking-[0.15em] text-primary md:text-4xl">
          ROVA MEMORY
        </h1>
        <p className="font-sans mt-1 text-xs tracking-widest text-muted-foreground">
          MATCH 2 NFT PRIZES IN 3 TRIALS &bull; WIN 3 IN A ROW &bull; MINT NFT
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
          <ScratchGame />

          <aside className="space-y-4 lg:sticky lg:top-20">
            <RovaWallet />

            <div className="border-2 border-border bg-card p-4 text-foreground">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
                HOW IT CONNECTS
              </h3>
              <div className="font-sans space-y-3 text-xs text-muted-foreground">
                <div className="border-l-2 border-primary pl-3">
                  <strong className="text-foreground block mb-1">
                    1 — The board
                  </strong>
                  4×3 face-down cards. Two NFT prize cards hide among 10 ROVA
                  logo tiles. Board reshuffles every new game.
                </div>
                <div className="border-l-2 border-[#7e22ce] pl-3">
                  <strong className="text-foreground block mb-1">
                    2 — 3 trials
                  </strong>
                  Each trial is 2 picks. If the pair is different, both cards
                  close back face-down. Match both NFT prizes within 3 trials to win.
                </div>
                <div className="border-l-2 border-[#00c853] pl-3">
                  <strong className="text-foreground block mb-1">
                    3 — Win streak
                  </strong>
                  Win 3 rounds in a row with zero losses to mint an NFT. Lose
                  once — even at 2/3 — streak resets to 0.
                </div>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-4 text-foreground">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-primary mb-3">
                BOARD (4×3)
              </h3>
              <div className="space-y-2 font-sans text-xs">
                {[
                  { label: "ROVA LOGO", count: 10, image: "/logo.png" },
                  { label: "NFT PRIZE", count: 2, image: "/banner.png" },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 border-2 border-black bg-white px-2 py-0.5 font-bold tracking-wider text-foreground">
                      <img
                        src={r.image}
                        alt={r.label}
                        className="h-5 w-5 object-contain"
                      />
                      {r.label}
                    </span>
                    <span className="text-muted-foreground">{r.count} cards</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                ROVA tiles are decoys. Find and match the 2 NFT prize cards.
              </p>
            </div>

            <div className="border-2 border-[#ffd700] bg-card p-4">
              <h3 className="font-head text-sm font-black uppercase tracking-widest text-[#ffd700] mb-3">
                ROVA ECONOMY
              </h3>
              <ul className="font-sans space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <strong className="text-foreground">1 CELO</strong> →{" "}
                  {ROVA_PER_CELO} ROVA
                </li>
                <li>
                  <strong className="text-foreground">1 game</strong> →{" "}
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
