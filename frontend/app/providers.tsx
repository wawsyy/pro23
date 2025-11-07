"use client";

import "@rainbow-me/rainbowkit/styles.css";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import "@/lib/suppressWalletConnectWarnings";

// Suppress server-side errors (runs in Node.js during SSR)
if (typeof process !== "undefined") {
  require("@/lib/suppressServerErrors");
}

type Props = {
  children: ReactNode;
};

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "0bd72b5be51c4abdb52fe29f8659b7e8";

const wagmiConfig = getDefaultConfig({
  appName: "Encrypted Trip Planner",
  projectId: walletConnectProjectId,
  chains: [hardhat, sepolia],
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Suppress network errors in development
      retry: process.env.NODE_ENV === "production" ? 3 : 0,
    },
  },
});

export function Providers({ children }: Props) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          // Suppress WalletConnect allowlist warnings in development
          initialChain={hardhat}
        >
          <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
