import { parseEther } from "viem";
import {
  CELO_BUY_PACK,
  ROVA_PER_CELO,
  ROVA_PER_GAME,
} from "@/constants/rova";

/** ROVA credits granted for a given CELO amount (proportional to pack rate). */
export function rovaCreditsForCelo(celoAmount: string): number {
  const wei = parseEther(celoAmount);
  const packWei = parseEther(CELO_BUY_PACK);
  const rovaWei = (wei * BigInt(ROVA_PER_CELO)) / packWei;
  return Number(rovaWei);
}

export function gamesFromRova(rova: number): number {
  return Math.floor(rova / ROVA_PER_GAME);
}
