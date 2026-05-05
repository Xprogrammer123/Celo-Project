import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import {
  coinbaseWallet,
  metaMaskWallet,
  walletConnect,
} from "@rainbow-me/rainbowkit/wallets";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID ?? "";

export const wallets = [
  metaMaskWallet,
  coinbaseWallet,
  walletConnect,
];

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ?? undefined
    ),
  },
  ssr: true,
});

export { projectId };
