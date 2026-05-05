import type { Abi } from "viem";
import artifact from "./LootScratch.json";

/** Typed ABI for wagmi / viem (artifact JSON is widened to generic Abi). */
export const lootScratchAbi = artifact.abi as unknown as Abi;
