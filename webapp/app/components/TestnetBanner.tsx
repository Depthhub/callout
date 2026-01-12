'use client'

import { AlertTriangle } from 'lucide-react'

/**
 * TestnetBanner Component
 * 
 * Persistent banner warning users they are on a testnet.
 * This is a critical UX element to prevent confusion about real funds.
 */
export function TestnetBanner() {
  return (
    <div className="testnet-banner">
      <AlertTriangle size={14} />
      <span>
        <strong>BASE SEPOLIA TESTNET</strong> — This is a test environment. No real funds.
      </span>
      <style jsx>{`
        .testnet-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
          color: white;
          font-size: 11px;
          font-weight: 500;
          padding: 6px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 10000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  )
}

