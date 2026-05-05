import { ScratchGame } from "@/components/scratch-card/scratch-game";

export default function PlayPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-head mb-8 text-center text-3xl font-black uppercase md:text-4xl">
        SCRATCH. WIN. FLEX.
      </h1>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <ScratchGame />
        <aside className="font-sans space-y-4 text-sm text-muted-foreground lg:sticky lg:top-24">
          <p className="border-2 border-black bg-muted p-4 shadow-[var(--shadow-sm)]">
            Chainlink VRF picks your rarity after you pay. While it confirms,
            scratch the grid — chaos is part of the brand.
          </p>
          <p>
            Daily limit: <strong className="text-foreground">5</strong> scratches
            per wallet (UTC). Streak three days — next Legendary odds tick up.
          </p>
        </aside>
      </div>
    </div>
  );
}
