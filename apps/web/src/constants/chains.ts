/**
 * Network switch:
 *   Mainnet (default): NEXT_PUBLIC_CELO_NETWORK=mainnet  → chains.mainnet.ts
 *   Faucet testnet:    NEXT_PUBLIC_CELO_NETWORK=sepolia   → chains.sepolia.ts
 *
 * Run testnet locally:  pnpm dev:sepolia   (from repo root or apps/web)
 */
import * as mainnet from "./chains.mainnet";
import * as sepolia from "./chains.sepolia";

const envNetwork = process.env.NEXT_PUBLIC_CELO_NETWORK?.trim().toLowerCase();
const active = envNetwork === "sepolia" ? sepolia : mainnet;

export const configuredChain = active.configuredChain;
export const celoRpcUrl = active.celoRpcUrl;
export const networkId = active.networkId;
export const networkLabel = active.networkLabel;
export const faucetUrl = active.faucetUrl;
export const explorerUrl = active.explorerUrl;
export const isTestnet = networkId === "sepolia";
