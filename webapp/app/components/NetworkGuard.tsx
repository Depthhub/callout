'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { SUPPORTED_CHAIN_ID } from '../providers'

interface NetworkGuardProps {
  children: React.ReactNode
}

/**
 * NetworkGuard Component
 * 
 * Wraps content that requires the user to be on the correct network.
 * Shows a warning and switch button if connected to the wrong chain.
 * 
 * SECURITY: This is a UX guard only. Always validate chainId server-side
 * for any critical operations. This prevents users from accidentally
 * signing transactions on the wrong network.
 */
export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  // Not connected - render children (wallet connect will handle)
  if (!isConnected) {
    return <>{children}</>
  }

  // Correct network - render children
  if (chainId === SUPPORTED_CHAIN_ID) {
    return <>{children}</>
  }

  // Wrong network - show warning
  return (
    <div className="network-guard">
      <div className="network-guard__content">
        <div className="network-guard__icon">
          <AlertTriangle size={32} color="var(--warning)" />
        </div>
        <h3 className="network-guard__title">Wrong Network</h3>
        <p className="network-guard__message">
          Please switch to <strong>Base Sepolia Testnet</strong> to continue.
        </p>
        <p className="network-guard__hint">
          This is a testnet application. Do not use real funds.
        </p>
        <button
          className="btn btn-primary btn-press"
          onClick={() => switchChain({ chainId: SUPPORTED_CHAIN_ID })}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <RefreshCw size={16} className="spin" />
              Switching...
            </>
          ) : (
            'Switch to Base Sepolia'
          )}
        </button>
      </div>

      <style jsx>{`
        .network-guard {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }
        .network-guard__content {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          max-width: 400px;
          text-align: center;
        }
        .network-guard__icon {
          margin-bottom: 16px;
        }
        .network-guard__title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--warning);
        }
        .network-guard__message {
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .network-guard__hint {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-bottom: 20px;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

/**
 * Hook to check if user is on correct network
 * Use this for conditional rendering or disabling buttons
 */
export function useIsCorrectNetwork(): boolean {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  
  if (!isConnected) return true // Not connected, let wallet flow handle it
  return chainId === SUPPORTED_CHAIN_ID
}

