'use client'

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { User, Wallet, LogOut, ExternalLink, AlertTriangle } from 'lucide-react'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { SUPPORTED_CHAIN_ID } from '../providers'

export default function ProfilePage() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : ''
  
  const isCorrectNetwork = chainId === SUPPORTED_CHAIN_ID
  const networkName = isCorrectNetwork ? 'Base Sepolia (Testnet)' : 'Wrong Network'

  if (!isConnected) {
    return (
      <div className="app">
        <Header />
        <main className="app-content with-bottom-nav">
          <div className="page-header">
            <h1 className="page-title">Profile</h1>
          </div>
          
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-title">Connect Wallet</div>
            <div className="empty-text">
              Connect your wallet to view your profile.
            </div>
            <button 
              className="btn btn-primary btn-press"
              onClick={() => connect({ connector: connectors[0] })}
            >
              Connect Wallet
            </button>
          </div>
        </main>
        <BottomNav active="profile" />
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      
      <main className="app-content with-bottom-nav">
        <div className="page-header">
          <h1 className="page-title">Profile</h1>
        </div>

        {/* User Card */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(200, 255, 68, 0.2), rgba(200, 255, 68, 0.05))',
              border: '2px solid rgba(200, 255, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <User size={24} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                {shortAddress}
              </div>
              <div style={{ 
                color: isCorrectNetwork ? 'var(--text-tertiary)' : 'var(--warning)', 
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {!isCorrectNetwork && <AlertTriangle size={12} />}
                {networkName}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <a 
              href={`https://sepolia.basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                borderBottom: '1px solid rgba(31, 32, 40, 0.5)',
              }}
            >
              <Wallet size={20} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ flex: 1 }}>View on Explorer</span>
              <ExternalLink size={16} style={{ color: 'var(--text-tertiary)' }} />
            </a>
            
            <button
              onClick={() => disconnect()}
              className="btn-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <LogOut size={20} />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  )
}




