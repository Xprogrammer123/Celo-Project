import { celo } from "wagmi/chains";

/** Production — real CELO on Celo mainnet (chain 42220). */
export const configuredChain = celo;
export const celoRpcUrl =
  process.env.CELO_RPC_URL?.trim() || "https://forno.celo.org";
export const networkId = "mainnet" as const;
export const networkLabel = "Celo Mainnet";
export const faucetUrl: string | null = null;
export const explorerUrl = "https://celoscan.io";
