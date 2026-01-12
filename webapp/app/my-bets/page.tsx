'use client'

import { useAccount, useConnect } from 'wagmi'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMarkets } from '../context/MarketsContext'
import Link from 'next/link'

export default function MyBets() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { userBets } = useMarkets()

  if (!isConnected) {
    return (
      <div className="app">
        <Header />
        <main className="app-content with-bottom-nav">
          <div className="page-header">
            <h1 className="page-title">Portfolio</h1>
          </div>
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <div className="empty-title">Connect Wallet</div>
            <div className="empty-text">Connect your wallet to view your bets.</div>
            <button 
              className="btn btn-primary btn-press"
              onClick={() => connect({ connector: connectors[0] })}
            >
              Connect Wallet
            </button>
          </div>
        </main>
        <BottomNav active="portfolio" />
      </div>
    )
  }

  // Calculate portfolio metrics
  const totalStaked = userBets.reduce((sum, b) => sum + b.stake, 0)
  const activeBets = userBets.filter(b => b.status === 'open').length
  
  // Gains/Loss: sum of (payout - stake) for resolved bets, 0 for open
  const gainsLoss = userBets.reduce((sum, b) => {
    if (b.status === 'won' || b.status === 'lost') {
      return sum + ((b.payout ?? 0) - b.stake)
    }
    return sum // open bets contribute 0
  }, 0)

  const isPositive = gainsLoss >= 0

  return (
    <div className="app">
      <Header />
      <main className="app-content with-bottom-nav">
        <div className="page-header">
          <h1 className="page-title">Portfolio</h1>
        </div>

        {/* Portfolio Summary Card */}
        <div className="portfolio-summary animate-slide-up">
          {/* Main Stats Row */}
          <div className="portfolio-summary__stats">
            {/* Total Staked */}
            <div className="portfolio-summary__stat">
              <span className="portfolio-summary__label">Total Staked</span>
              <span className="portfolio-summary__value">${totalStaked}</span>
            </div>
            
            {/* Divider */}
            <div className="portfolio-summary__divider" />
            
            {/* Active Bets */}
            <div className="portfolio-summary__stat">
              <span className="portfolio-summary__label">Active Bets</span>
              <span className="portfolio-summary__value">{activeBets}</span>
            </div>
          </div>

          {/* Gains/Loss Row */}
          <div className="portfolio-summary__pnl-row">
            <span className="portfolio-summary__pnl-label">Gains / Loss</span>
            <div className={`portfolio-summary__pnl-badge ${isPositive ? 'portfolio-summary__pnl-badge--positive' : 'portfolio-summary__pnl-badge--negative'}`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{isPositive ? '+' : ''}${gainsLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bets List */}
        <div className="portfolio-section-header">
          <span>Your Positions</span>
          <span className="portfolio-section-count">{userBets.length}</span>
        </div>

        {userBets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">No bets yet</div>
            <div className="empty-text">Place your first bet to see it here.</div>
          </div>
        ) : (
          <div className="portfolio-bets-list">
            {userBets.map((bet, index) => (
              <Link key={bet.marketId} href={`/market/${bet.marketId}`} style={{ textDecoration: 'none' }}>
                <div 
                  className="portfolio-bet-card btn-press animate-slide-up" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Top Row: Position badge + Status */}
                  <div className="portfolio-bet-card__header">
                    <span className={`portfolio-bet-card__position ${bet.side === 'yes' ? 'portfolio-bet-card__position--yes' : 'portfolio-bet-card__position--no'}`}>
                      {bet.side.toUpperCase()}
                    </span>
                    <span className={`portfolio-bet-card__status ${bet.status === 'won' ? 'portfolio-bet-card__status--won' : bet.status === 'lost' ? 'portfolio-bet-card__status--lost' : ''}`}>
                      {bet.status === 'open' ? '● Active' : bet.status === 'won' ? '✓ Won' : '✗ Lost'}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="portfolio-bet-card__question">
                    {bet.question}
                  </div>

                  {/* Meta Row */}
                  <div className="portfolio-bet-card__meta">
                    <span>Stake: {bet.stake} USDC</span>
                    {(bet.status === 'won' || bet.status === 'lost') && bet.payout !== undefined && (
                      <span className={bet.payout > bet.stake ? 'portfolio-bet-card__meta--positive' : 'portfolio-bet-card__meta--negative'}>
                        {bet.payout > bet.stake ? '+' : ''}{(bet.payout - bet.stake).toFixed(0)} USDC
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav active="portfolio" />
    </div>
  )
}
