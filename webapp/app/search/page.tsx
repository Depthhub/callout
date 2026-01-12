'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search as SearchIcon } from 'lucide-react'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { PostPreviewCard } from '../components/PostPreviewCard'
import { useMarkets, Market } from '../context/MarketsContext'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { markets } = useMarkets()

  // Filter markets based on search query
  const filteredMarkets = query.length > 0
    ? markets.filter(market => {
        const searchLower = query.toLowerCase()
        return (
          market.question.toLowerCase().includes(searchLower) ||
          market.authorHandle.toLowerCase().includes(searchLower) ||
          market.postText.toLowerCase().includes(searchLower)
        )
      })
    : []

  return (
    <div className="app">
      <Header />

      <main className="app-content with-bottom-nav">
        <div className="page-header">
          <h1 className="page-title">Search</h1>
        </div>

        <div className="form-group">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search markets..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
            <SearchIcon
              size={20}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)'
              }}
            />
          </div>
        </div>

        {query.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Find Markets</div>
            <div className="empty-text">
              Search for prediction markets by keyword, author, or topic.
            </div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No results</div>
            <div className="empty-text">
              No markets found for "{query}". Try a different search.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--text-tertiary)', 
              marginBottom: 'var(--spacing-md)' 
            }}>
              {filteredMarkets.length} result{filteredMarkets.length !== 1 ? 's' : ''} for "{query}"
            </div>
            {filteredMarkets.map(market => (
              <SearchResultCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </main>

      <BottomNav active="search" />
    </div>
  )
}

function SearchResultCard({ market }: { market: Market }) {
  const totalPool = market.yesPool + market.noPool
  const yesPercent = totalPool > 0 ? Math.round((market.yesPool / totalPool) * 100) : 50
  const noPercent = 100 - yesPercent

  const formatPool = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const timeLeft = market.deadline - Date.now()
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (24 * 60 * 60 * 1000)))

  return (
    <Link href={`/market/${market.id}`} style={{ textDecoration: 'none' }}>
      <div className="card market-card btn-press animate-slide-up">
        <PostPreviewCard
          postUrl={market.postUrl}
          authorHandle={market.authorHandle}
          postText={market.postText}
          postedAt={market.postedAt}
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
            {market.status === 'open' && <span>⏰ {daysLeft}d left</span>}
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
