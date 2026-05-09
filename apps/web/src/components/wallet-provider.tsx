"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { configuredChain } from "@/constants/chains";

import { useMemo } from "react";

/** RainbowKit requires a non-empty WalletConnect Cloud project id for builds and SSR. */
const WC_FALLBACK_PROJECT_ID = "11111111-1111-4111-8111-111111111111";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || WC_FALLBACK_PROJECT_ID;

const wagmiConfig = getDefaultConfig({
  appName: "Rova",
  projectId,
  chains: [configuredChain],
  transports: {
    [configuredChain.id]: http(
      process.env.CELO_RPC_URL || undefined
    ),
  },
  ssr: true,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Create a stable QueryClient instance per lifecycle
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}