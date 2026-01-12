'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useMiniApp } from '../hooks/useMiniApp'

export function Header() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { isInMiniApp, isReady, user } = useMiniApp()
  const [showWalletOptions, setShowWalletOptions] = useState(false)

  // Auto-connect in mini app context
  useEffect(() => {
    if (isReady && isInMiniApp && !isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] })
    }
  }, [isReady, isInMiniApp, isConnected, connect, connectors])

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''

  const displayName = user?.displayName || user?.username || shortAddress

  const handleConnect = (connector: typeof connectors[0]) => {
    connect({ connector })
    setShowWalletOptions(false)
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-logo">
          <img
            src="/logo.png"
            alt="VOUCHEO"
          />
        </div>

        {isConnected ? (
          <button className="wallet-btn btn-press" onClick={() => disconnect()}>
            {user?.pfpUrl ? (
              <img
                src={user.pfpUrl}
                alt=""
                className="wallet-avatar-img"
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
            ) : (
              <div className="wallet-avatar" />
            )}
            <span>{displayName}</span>
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-primary btn-sm btn-press"
              onClick={() => setShowWalletOptions(!showWalletOptions)}
              disabled={isPending}
            >
              {isPending ? 'Connecting...' : 'Connect'}
            </button>

            {showWalletOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '180px',
                zIndex: 100,
              }}>
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => handleConnect(connector)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {connector.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
