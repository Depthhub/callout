'use client'

import { ReactNode, useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { MarketsProvider } from './context/MarketsContext'

// ============================================================
// TESTNET ONLY - Base Sepolia (Chain ID: 84532)
// ============================================================
// WARNING: This application is configured for BASE SEPOLIA TESTNET ONLY.
// DO NOT deploy this application targeting mainnet without a full security audit.
// The chain is hardcoded to prevent accidental mainnet deployments.
// ============================================================
const SUPPORTED_CHAIN = baseSepolia
const SUPPORTED_CHAIN_ID = 84532

// Export for use in chain validation components
export { SUPPORTED_CHAIN, SUPPORTED_CHAIN_ID }

// Wagmi config - TESTNET ONLY
const config = createConfig({
  chains: [SUPPORTED_CHAIN],
  connectors: [
    coinbaseWallet({
      appName: 'VOUCHEO',
      preference: 'all',
    }),
    injected(),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

// MiniKit context for frame-specific features
export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={SUPPORTED_CHAIN}
          config={{
            appearance: {
              mode: 'dark',
              theme: 'base',
              name: 'VOUCHEO',
            },
          }}
        >
          <MarketsProvider>
            {mounted ? children : null}
          </MarketsProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
