"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";

// 1. Get projectId from https://dashboard.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Missing NEXT_PUBLIC_REOWN_PROJECT_ID in environment variables"
  );
}

// 2. Create a metadata object - optional
const metadata = {
  name: "EventChain",
  description:
    "EventChain is a decentralized ticketing platform built on the Base blockchain. Users can create events, buy tickets, claim refunds",
  url: typeof window !== "undefined" ? window.location.origin : "",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [base, baseSepolia],
  projectId,
  ssr: true,
});

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks: [base, baseSepolia],
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
