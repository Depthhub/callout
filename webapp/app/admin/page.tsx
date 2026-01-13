'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Shield, CheckCircle, XCircle, Clock, ExternalLink, AlertTriangle, DollarSign } from 'lucide-react'
import { Header } from '../components/Header'
import { useMarkets, Market } from '../context/MarketsContext'
import { useResolveMarket, usePlatformFees, useWithdrawFees } from '../hooks/useContract'

// Admin wallet address - only this wallet can access and use the admin panel
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '0xEC611cd89b2C2f713e219f706Cf0A93B94114854'

export default function AdminPage() {
  const { address, isConnected } = useAccount()
  const { markets, resolveMarket: resolveMarketLocal } = useMarkets()
  const { resolveMarket: resolveMarketOnChain, isPending: isResolvingOnChain } = useResolveMarket()
  const { feePercent, accumulatedFees, refetchFees } = usePlatformFees()
  const { withdrawFees, isPending: isWithdrawing, isSuccess: withdrawSuccess } = useWithdrawFees()
  const [resolving, setResolving] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Check if connected wallet is admin
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase()

  // Filter markets that need resolution (past deadline, not yet resolved)
  const pendingResolution = markets.filter(
    m => m.status === 'locked' || (m.status === 'open' && m.deadline < Date.now())
  )
  const resolvedMarkets = markets.filter(m => m.status === 'resolved')

  const handleResolve = async (marketId: number, outcomeYes: boolean) => {
    setResolving(marketId)
    setError(null)
    setSuccess(null)

    try {
      // Try to resolve on-chain first (if contract is deployed)
      // resolveMarketOnChain(marketId, outcomeYes)

      // Also update local state
      await resolveMarketLocal(marketId, outcomeYes)
      setSuccess(`Market #${marketId} resolved as ${outcomeYes ? 'YES' : 'NO'}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve market')
    } finally {
      setResolving(null)
    }
  }

  const handleWithdrawFees = async () => {
    if (!address) return
    setError(null)
    setSuccess(null)

    try {
      await withdrawFees(address)
      await refetchFees()
      setSuccess(`Successfully withdrew ${accumulatedFees} USDC in fees!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw fees')
    }
  }

  // Not connected - show connect prompt
  if (!isConnected) {
    return (
      <div className="app">
        <Header />
        <main className="app-content" style={{ paddingTop: '100px' }}>
          <div className="empty-state">
            <div className="empty-icon"><Shield size={48} /></div>
            <div className="empty-title">Admin Access Required</div>
            <div className="empty-text">
              Connect your wallet to access the admin panel.
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Connected but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="app">
        <Header />
        <main className="app-content" style={{ paddingTop: '100px' }}>
          <div className="empty-state">
            <div className="empty-icon"><XCircle size={48} color="var(--error)" /></div>
            <div className="empty-title">Access Denied</div>
            <div className="empty-text">
              This wallet does not have admin privileges.
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Admin view
  return (
    <div className="app">
      <Header />

      <main className="app-content" style={{ paddingBottom: '40px' }}>
        <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} color="var(--primary)" />
            <h1 className="page-title">Admin Panel</h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Resolve prediction markets after their deadline
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="admin-alert admin-alert--error">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div className="admin-alert admin-alert--success">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {/* Platform Fees Card */}
        <div className="card" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, rgba(200, 255, 68, 0.1), rgba(200, 255, 68, 0.05))' }}>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <DollarSign size={18} color="var(--primary)" />
              <h3 style={{ fontWeight: '600', fontSize: '14px', margin: 0 }}>Platform Fees</h3>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  Accumulated Fees
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
                  {parseFloat(accumulatedFees).toFixed(2)} USDC
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  Fee Rate
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {feePercent}%
                </div>
              </div>
            </div>

            {parseFloat(accumulatedFees) > 0 ? (
              <button
                className="btn btn-primary btn-full btn-press"
                onClick={handleWithdrawFees}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? 'Withdrawing...' : `Collect ${accumulatedFees} USDC`}
              </button>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '12px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-tertiary)'
              }}>
                No fees accumulated yet
              </div>
            )}
          </div>
        </div>

        {/* Reset Demo Data Button */}
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '16px' }}
          onClick={() => {
            if (confirm('Reset all demo data? This will clear all markets and bets.')) {
              localStorage.clear()
              window.location.reload()
            }
          }}
        >
          Reset Demo Data
        </button>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat">
            <span className="admin-stat__value">{pendingResolution.length}</span>
            <span className="admin-stat__label">Pending</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__value">{resolvedMarkets.length}</span>
            <span className="admin-stat__label">Resolved</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat__value">{markets.length}</span>
            <span className="admin-stat__label">Total</span>
          </div>
        </div>

        {/* Pending Resolution */}
        <div className="admin-section">
          <h2 className="admin-section__title">
            <Clock size={16} />
            Pending Resolution ({pendingResolution.length})
          </h2>

          {pendingResolution.length === 0 ? (
            <div className="admin-empty">
              No markets waiting for resolution
            </div>
          ) : (
            <div className="admin-list">
              {pendingResolution.map(market => (
                <AdminMarketCard
                  key={market.id}
                  market={market}
                  onResolve={handleResolve}
                  isResolving={resolving === market.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recently Resolved */}
        {resolvedMarkets.length > 0 && (
          <div className="admin-section">
            <h2 className="admin-section__title">
              <CheckCircle size={16} />
              Recently Resolved ({resolvedMarkets.length})
            </h2>
            <div className="admin-list">
              {resolvedMarkets.slice(0, 5).map(market => (
                <div key={market.id} className="admin-card admin-card--resolved">
                  <div className="admin-card__header">
                    <span className="admin-card__id">#{market.id}</span>
                    <span className={`admin-card__outcome ${market.outcomeYes ? 'yes' : 'no'}`}>
                      {market.outcomeYes ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <p className="admin-card__question">{market.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function AdminMarketCard({
  market,
  onResolve,
  isResolving
}: {
  market: Market
  onResolve: (id: number, outcomeYes: boolean) => void
  isResolving: boolean
}) {
  const totalPool = market.yesPool + market.noPool
  const yesPercent = totalPool > 0 ? Math.round((market.yesPool / totalPool) * 100) : 50

  const formatPool = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const daysPastDeadline = Math.floor((Date.now() - market.deadline) / (24 * 60 * 60 * 1000))

  return (
    <div className="admin-card">
      <div className="admin-card__header">
        <span className="admin-card__id">#{market.id}</span>
        <span className="admin-card__overdue">
          {daysPastDeadline > 0 ? `${daysPastDeadline}d overdue` : 'Just ended'}
        </span>
      </div>

      <p className="admin-card__question">{market.question}</p>

      <div className="admin-card__meta">
        <span>@{market.authorHandle}</span>
        <span>{formatPool(totalPool)} USDC</span>
        <span>YES {yesPercent}%</span>
      </div>

      {market.postUrl && (
        <a
          href={market.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-card__link"
        >
          <ExternalLink size={12} />
          View original post
        </a>
      )}

      <div className="admin-card__actions">
        <button
          className="btn btn-success btn-press"
          onClick={() => onResolve(market.id, true)}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Resolve YES'}
        </button>
        <button
          className="btn btn-error btn-press"
          onClick={() => onResolve(market.id, false)}
          disabled={isResolving}
        >
          {isResolving ? 'Resolving...' : 'Resolve NO'}
        </button>
      </div>
    </div>
  )
}
