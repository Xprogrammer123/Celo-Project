/** ROVA credits granted per standard pack. */
export const ROVA_PER_CELO = 100;

/** Cost to start one memory game round. */
export const ROVA_PER_GAME = 2;

/** Demo / guest starting balance (3 games). */
export const ROVA_DEMO_START = ROVA_PER_GAME * 3;

/** CELO for the 100 ROVA pack. */
export const CELO_BUY_PACK = "0.3";

/** CELO cost for one game (2 ROVA at pack rate). */
export const CELO_PER_GAME = "0.006";

export type RovaPack = {
  rova: number;
  celo: string;
};

/** Tap-to-buy packs — price scales with ROVA (100 ROVA = 0.3 CELO). */
export const ROVA_PACKS: RovaPack[] = [
  { rova: 100, celo: "0.3" },
  { rova: 50, celo: "0.15" },
  { rova: 20, celo: "0.06" },
];

