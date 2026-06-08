"use client";

import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { celoRpcUrl, configuredChain } from "@/constants/chains";

import { useMemo } from "react";

/** RainbowKit requires a non-empty WalletConnect Cloud project id for builds and SSR. */
const WC_FALLBACK_PROJECT_ID = "11111111-1111-4111-8111-111111111111";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || WC_FALLBACK_PROJECT_ID;

const serverConfig = createConfig({
  chains: [configuredChain],
  transports: {
    [configuredChain.id]: http(celoRpcUrl),
  },
  ssr: true,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const isBrowser = typeof window !== "undefined";

  // Create a stable QueryClient instance per lifecycle
  const queryClient = useMemo(() => new QueryClient(), []);
  const wagmiConfig = useMemo(() => {
    if (!isBrowser) return null;
    return getDefaultConfig({
      appName: "Rova",
      projectId,
      chains: [configuredChain],
      transports: {
        [configuredChain.id]: http(celoRpcUrl),
      },
      ssr: false,
    });
  }, [isBrowser]);

  return (
    <WagmiProvider config={wagmiConfig ?? serverConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}