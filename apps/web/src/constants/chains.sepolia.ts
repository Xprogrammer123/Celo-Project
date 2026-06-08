import { celoSepolia } from "wagmi/chains";

/** Testnet — faucet CELO from https://faucet.celo.org/celo-sepolia (chain 11142220). */
export const configuredChain = celoSepolia;
export const celoRpcUrl =
  process.env.CELO_RPC_URL?.trim() ||
  "https://forno.celo-sepolia.celo-testnet.org";
export const networkId = "sepolia" as const;
export const networkLabel = "Celo Sepolia";
export const faucetUrl = "https://faucet.celo.org/celo-sepolia";
export const explorerUrl = "https://sepolia.celoscan.io";
