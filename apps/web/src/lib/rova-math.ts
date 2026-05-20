import { parseEther } from "viem";
import { ROVA_PER_CELO, ROVA_PER_GAME } from "@/constants/rova";

/** ROVA credits granted for a given CELO amount (proportional to 100 ROVA per 1 CELO). */
export function rovaCreditsForCelo(celoAmount: string): number {
  const wei = parseEther(celoAmount);
  const rovaWei =
    (wei * BigInt(ROVA_PER_CELO)) / parseEther("1");
  return Number(rovaWei);
}

export function gamesFromRova(rova: number): number {
  return Math.floor(rova / ROVA_PER_GAME);
}
