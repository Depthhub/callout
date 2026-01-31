'use client'

import Link from 'next/link'
import { useMarketsList, OnChainMarket } from '../hooks/useMarketsList'

// Export Market type for compatibility
export type Market = OnChainMarket

interface MarketListProps {
  filter: 'open' | 'resolved'
}

export function MarketList({ filter }: MarketListProps) {
  const { markets, isLoading, error, contractConfigured, marketCount, refetch } = useMarketsList()
  
  const filteredMarkets = markets.filter(m => {
    if (filter === 'open') return m.status === 'open' || m.status === 'locked'
    return m.status === 'resolved'
  })

  // Show loading state
  if (isLoading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⏳</div>
        <div className="empty-title">Loading markets...</div>
        <div className="empty-text">Fetching from Base Sepolia blockchain</div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚠️</div>
        <div className="empty-title">Error loading markets</div>
        <div className="empty-text">{error}</div>
        <button 
          className="btn btn-primary" 
          onClick={refetch}
          style={{ marginTop: '1rem' }}
        >
          Retry
        </button>
      </div>
    )
  }

  // Show message if contract not configured
  if (!contractConfigured) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⚙️</div>
        <div className="empty-title">Contract not configured</div>
        <div className="empty-text">
          Smart contract address not set.
          <br />
          Check NEXT_PUBLIC_MARKETS_ADDRESS environment variable.
        </div>
      </div>
    )
  }

  if (filteredMarkets.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <div className="empty-title">No {filter} markets</div>
        <div className="empty-text">
          {filter === 'open' 
            ? `Total markets on chain: ${marketCount}. Be the first to create an open market!`
            : 'No resolved markets to show.'}
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={refetch}
          style={{ marginTop: '1rem' }}
        >
          🔄 Refresh
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        <span>Showing {filteredMarkets.length} of {marketCount} markets</span>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={refetch}
          style={{ 
            padding: '0.25rem 0.75rem',
            fontSize: '0.875rem'
          }}
        >
          🔄 Refresh
        </button>
      </div>
      {filteredMarkets.map((market, index) => (
        <MarketCard key={market.id} market={market} index={index} />
      ))}
    </div>
  )
}

export function MarketCard({ market, index = 0 }: { market: Market; index?: number }) {
  const totalPool = market.yesPool + market.noPool
  const yesPercent = totalPool > 0 ? Math.round((market.yesPool / totalPool) * 100) : 50
  const noPercent = 100 - yesPercent

  const formatPool = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toFixed(2)
  }

  const timeLeft = market.deadline - Date.now()
  const isExpired = timeLeft <= 0

  // Format time left more accurately
  const formatTimeLeft = () => {
    if (isExpired) return 'Expired'

    const hours = Math.floor(timeLeft / (60 * 60 * 1000))
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24

    if (days > 0) {
      return `${days}d ${remainingHours}h`
    } else if (hours > 0) {
      return `${hours}h left`
    } else {
      const minutes = Math.floor(timeLeft / (60 * 1000))
      return `${minutes}m left`
    }
  }

  const timeLeftDisplay = formatTimeLeft()

  return (
    <Link href={`/market/${market.id}`} style={{ textDecoration: 'none' }}>
      <div className="card market-card btn-press animate-slide-up" style={{ animationDelay: `${Math.min(index, 4) * 50}ms` }}>
        <div className="card-body">
          {/* Status */}
          <div className={`market-status ${market.status}`}>
            {market.status === 'open' && '🟢 OPEN'}
            {market.status === 'locked' && '🔒 AWAITING RESOLUTION'}
            {market.status === 'resolved' && (market.outcomeYes ? '✅ YES WON' : '❌ NO WON')}
          </div>

          {/* Question */}
          <h3 className="market-question">{market.question}</h3>

          {/* Meta */}
          <div className="market-meta">
            <span>💰 {formatPool(totalPool)} USDC</span>
            {(market.status === 'open' || market.status === 'locked') && (
              <span style={{ color: isExpired ? 'var(--warning)' : 'inherit' }}>
                ⏰ {timeLeftDisplay}
              </span>
            )}
          </div>

          {/* Odds Bar */}
          <div className="odds-bar">
            <div className="odds-yes" style={{ width: `${Math.max(yesPercent, 15)}%` }}>
              YES {yesPercent}%
            </div>
            <div className="odds-no" style={{ width: `${Math.max(noPercent, 15)}%` }}>
              NO {noPercent}%
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
