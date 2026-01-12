'use client'

import { useAccount } from 'wagmi'
import { useState } from 'react'
import { useMarkets } from '../context/MarketsContext'

// Mini sparkline chart component
function MiniLineChart({ series }: { series: number[] }) {
  if (series.length < 2) {
    // Not enough points to draw a line
    return (
      <div className="portfolio-chart portfolio-chart--empty">
        <span className="portfolio-chart__placeholder">Collecting data...</span>
      </div>
    )
  }

  const width = 280
  const height = 56
  const padding = 4

  // Normalize values to fit viewBox
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1 // Avoid division by zero for flat lines

  const points = series.map((value, i) => {
    const x = padding + (i / (series.length - 1)) * (width - padding * 2)
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  // Create fill path (area under line)
  const fillPath = `M ${padding},${height - padding} ` +
    series.map((value, i) => {
      const x = padding + (i / (series.length - 1)) * (width - padding * 2)
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `L ${x},${y}`
    }).join(' ') +
    ` L ${width - padding},${height - padding} Z`

  return (
    <div className="portfolio-chart animate-fade-in">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        className="portfolio-chart__svg"
      >
        {/* Gradient definition for fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(200, 255, 68, 0.25)" />
            <stop offset="100%" stopColor="rgba(200, 255, 68, 0)" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path 
          d={fillPath} 
          fill="url(#chartGradient)"
          className="portfolio-chart__fill"
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          className="portfolio-chart__line"
        />
        
        {/* Current value dot */}
        {series.length > 0 && (
          <circle
            cx={width - padding}
            cy={height - padding - ((series[series.length - 1] - min) / range) * (height - padding * 2)}
            r="3"
            className="portfolio-chart__dot"
          />
        )}
      </svg>
    </div>
  )
}

export function PortfolioHeader() {
  const { isConnected } = useAccount()
  const { portfolioBalance, portfolioHistory, totalStaked } = useMarkets()

  // Chart state
  const [isChartOpen, setIsChartOpen] = useState(false)

  // Get chart series from portfolio history
  const chartSeries = portfolioHistory.map(entry => entry.balance)

  // Calculate P&L from history
  const computePnL = () => {
    if (portfolioHistory.length < 2) return null

    const firstEntry = portfolioHistory[0]
    const currentBalance = portfolioBalance

    const delta = currentBalance - firstEntry.balance
    const pct = (delta / firstEntry.balance) * 100

    return { delta, pct, isPositive: delta >= 0 }
  }

  // Format USD value
  const formatUsdValue = (value: number) => {
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `$${formatted}`
  }

  // Format P&L delta value
  const formatPnLDelta = (delta: number) => {
    const prefix = delta >= 0 ? '+' : ''
    const formatted = Math.abs(delta).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return `${prefix}$${formatted}`
  }

  // Format P&L percentage
  const formatPnLPct = (pct: number) => {
    const prefix = pct >= 0 ? '+' : ''
    return `${prefix}${pct.toFixed(2)}%`
  }

  // Disconnected state
  if (!isConnected) {
    return (
      <div className="portfolio-header portfolio-header--disconnected animate-slide-up">
        <div className="portfolio-header__label">
          <span className="portfolio-header__label-text">Portfolio</span>
        </div>
        <div className="portfolio-header__value">
          <span className="portfolio-header__primary portfolio-header__primary--muted">—</span>
        </div>
      </div>
    )
  }

  const pnl = computePnL()

  return (
    <div className="portfolio-header animate-slide-up">
      {/* Label row */}
      <div className="portfolio-header__label">
        <span className="portfolio-header__label-text">Portfolio</span>
        <span className="portfolio-header__live-dot" />
        <span className="portfolio-header__connected-chip">Connected</span>
      </div>

      {/* Primary value - Portfolio Balance */}
      <div className="portfolio-header__value">
        <span className="portfolio-header__primary">{formatUsdValue(portfolioBalance)}</span>
      </div>

      {/* P&L Row */}
      {pnl && (
        <div className={`portfolio-header__pnl ${pnl.isPositive ? 'portfolio-header__pnl--positive' : 'portfolio-header__pnl--negative'}`}>
          <span className="portfolio-header__pnl-value">
            {formatPnLDelta(pnl.delta)}
          </span>
          <span className="portfolio-header__pnl-pct">
            {formatPnLPct(pnl.pct)}
          </span>
        </div>
      )}

      {/* Chart toggle */}
      <button
        className="portfolio-header__chart-toggle btn-press"
        onClick={() => setIsChartOpen(!isChartOpen)}
        aria-expanded={isChartOpen}
        aria-label={isChartOpen ? 'Hide chart' : 'Show chart'}
      >
        <span className="portfolio-header__chart-toggle-icon">
          {isChartOpen ? '▲' : '▼'}
        </span>
        <span>{isChartOpen ? 'Hide chart' : 'Show chart'}</span>
      </button>

      {/* Collapsible chart */}
      {isChartOpen && (
        <MiniLineChart series={chartSeries} />
      )}

      {/* Active bets info */}
      {totalStaked > 0 && (
        <div className="portfolio-header__secondary">
          <span>{formatUsdValue(totalStaked)} in active bets</span>
        </div>
      )}
    </div>
  )
}
