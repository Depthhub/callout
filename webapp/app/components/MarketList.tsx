'use client'

import Link from 'next/link'
import { PostPreviewCard } from './PostPreviewCard'
import { useMarkets, Market } from '../context/MarketsContext'

// Re-export Market type for compatibility
export type { Market } from '../context/MarketsContext'

interface MarketListProps {
  filter: 'open' | 'resolved'
}

export function MarketList({ filter }: MarketListProps) {
  const { markets } = useMarkets()
  
  const filteredMarkets = markets.filter(m => {
    if (filter === 'open') return m.status === 'open'
    return m.status === 'resolved'
  })

  if (filteredMarkets.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <div className="empty-title">No markets yet</div>
        <div className="empty-text">
          {filter === 'open' 
            ? 'Be the first to create a market!'
            : 'No resolved markets to show.'}
        </div>
      </div>
    )
  }

  return (
    <div>
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
    return n.toString()
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
        {/* Post Preview Section */}
        <PostPreviewCard
          postUrl={market.postUrl}
          authorHandle={market.authorHandle}
          postText={market.postText}
          postedAt={market.postedAt}
          platform={market.platform}
          compact
        />

        <div className="card-body">
          {/* Status */}
          <div className={`market-status ${market.status}`}>
            {market.status === 'open' && '🟢 OPEN'}
            {market.status === 'locked' && '🔒 LOCKED'}
            {market.status === 'resolved' && (market.outcomeYes ? '✅ YES' : '❌ NO')}
          </div>

          {/* Question */}
          <h3 className="market-question">{market.question}</h3>

          {/* Meta */}
          <div className="market-meta">
            <span>💰 {formatPool(totalPool)} USDC</span>
            {market.status === 'open' && (
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

