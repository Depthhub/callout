'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { Header } from '../../components/Header'
import { BottomNav } from '../../components/BottomNav'
import { PostPreviewCard } from '../../components/PostPreviewCard'
import { useMiniApp } from '../../hooks/useMiniApp'
import { usePlaceBet, useApproveUSDC, useUSDC } from '../../hooks/useContract'
import { useMarkets } from '../../context/MarketsContext'
import Link from 'next/link'

export default function MarketDetail() {
  const params = useParams()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { isInMiniApp, composeCast } = useMiniApp()
  const { getMarket, addBet, claimWinnings, getUserBetsForMarket } = useMarkets()

  const [betAmount, setBetAmount] = useState('')
  const [betSide, setBetSide] = useState<'yes' | 'no' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<{ payout: number; claimed: boolean } | null>(null)

  // Contract hooks (for when contract is deployed)
  const { placeBet, isPending: isBetting, isSuccess: betSuccess } = usePlaceBet()
  const { approve, isPending: isApproving } = useApproveUSDC()
  const { balance, allowance, refetchAllowance } = useUSDC()

  const marketId = parseInt(params.id as string)
  const market = getMarket(marketId)

  // Reset bet state after successful bet
  useEffect(() => {
    if (betSuccess) {
      setBetAmount('')
      setBetSide(null)
      setIsSubmitting(false)
    }
  }, [betSuccess])

  if (!market) {
    return (
      <div className="app">
        <Header />
        <main className="app-content with-bottom-nav">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">Market not found</div>
            <Link href="/" className="btn btn-primary">Back to Markets</Link>
          </div>
        </main>
        <BottomNav active="home" />
      </div>
    )
  }

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
      return `${days}d ${remainingHours}h left`
    } else if (hours > 0) {
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000))
      return `${hours}h ${minutes}m left`
    } else {
      const minutes = Math.floor(timeLeft / (60 * 1000))
      return `${minutes}m left`
    }
  }

  const timeLeftDisplay = formatTimeLeft()

  const calculatePayout = (amount: number, side: 'yes' | 'no') => {
    const stake = parseFloat(amount.toString()) || 0
    if (stake <= 0) return 0

    const newYesPool = side === 'yes' ? market.yesPool + stake : market.yesPool
    const newNoPool = side === 'no' ? market.noPool + stake : market.noPool
    const newTotal = newYesPool + newNoPool

    if (side === 'yes') {
      return (stake / newYesPool) * newTotal
    } else {
      return (stake / newNoPool) * newTotal
    }
  }

  const handleBet = async (side: 'yes' | 'no') => {
    if (!betAmount || !isConnected) return

    const amount = parseFloat(betAmount)
    setBetSide(side)
    setIsSubmitting(true)

    try {
      // Check if we need approval first
      if (parseFloat(allowance) < amount) {
        await approve((amount * 2).toString()) // Approve 2x for convenience
        await refetchAllowance()
      }

      // Place the bet on-chain (if contract is deployed)
      // placeBet(marketId, side === 'yes', betAmount)

      // For now, also update local state
      addBet(marketId, side, amount)

      setBetAmount('')
      setBetSide(null)
    } catch (error) {
      // SECURITY: Don't log error details that could expose user info
      // In production, send to error monitoring service with sanitized data
      if (process.env.NODE_ENV !== 'production') {
        console.error('Bet failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      // Use local claim for demo (will use on-chain when contract is deployed)
      const result = await claimWinnings(marketId)
      setClaimResult(result)
    } catch (error) {
      // SECURITY: Don't log error details that could expose user info
      if (process.env.NODE_ENV !== 'production') {
        console.error('Claim failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    } finally {
      setIsClaiming(false)
    }
  }

  // Get user's bets for this market
  const userBetsForMarket = getUserBetsForMarket(marketId)
  const userWinningBet = userBetsForMarket.find(bet => bet.status === 'won' && bet.payout && bet.payout > 0 && !bet.claimed)

  // Share functionality - uses composeCast in mini app context
  const handleShare = () => {
    const shareText = `🎯 ${market.question}\n\nYES: ${yesPercent}% | NO: ${noPercent}%\n💰 ${formatPool(totalPool)} USDC in pool\n\nPlace your bet on VOUCHEO!`
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://voucheo.app'}/market/${market.id}`

    if (isInMiniApp) {
      // Use composeCast for sharing in mini app
      composeCast(shareText, [shareUrl])
    } else {
      // Show share modal for web
      setShowShareModal(true)
    }
  }

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://voucheo.app'}/market/${market.id}`

  return (
    <div className="app">
      <Header />

      <main className="app-content with-bottom-nav">
        <div className="page-header">
          <Link href="/" className="back-btn">←</Link>
          <h1 className="page-title">Market #{market.id}</h1>
        </div>

        <div className="card" style={{ marginBottom: '16px' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div className={`market-status ${market.status}`}>
                {market.status === 'open' && '🟢 Open'}
                {market.status === 'locked' && '🔒 Locked'}
                {market.status === 'resolved' && (market.outcomeYes ? '✅ YES Won' : '❌ NO Won')}
              </div>
              <button
                className="btn btn-secondary btn-sm btn-press"
                onClick={handleShare}
              >
                📤 Share
              </button>
            </div>

            <h2 className="market-question" style={{ fontSize: '20px', marginBottom: '16px' }}>
              {market.question}
            </h2>

            {/* Post Preview Card */}
            {market.postText && (
              <div style={{ marginBottom: '16px' }}>
                <PostPreviewCard
                  postUrl={market.postUrl}
                  authorHandle={market.authorHandle}
                  postText={market.postText}
                  postedAt={market.postedAt}
                  platform={market.platform}
                  compact
                />
              </div>
            )}

            <div className="market-meta">
              <span>💰 {formatPool(totalPool)} USDC</span>
              {market.status === 'open' && (
                <span style={{ color: isExpired ? 'var(--warning)' : 'inherit' }}>
                  ⏰ {timeLeftDisplay}
                </span>
              )}
              {market.status === 'resolved' && <span>Resolved</span>}
            </div>

            <div className="odds-bar">
              <div className="odds-yes" style={{ width: `${Math.max(yesPercent, 15)}%` }}>
                YES {yesPercent}%
              </div>
              <div className="odds-no" style={{ width: `${Math.max(noPercent, 15)}%` }}>
                NO {noPercent}%
              </div>
            </div>

            <div className="odds-stats">
              <span>{formatPool(market.yesPool)} USDC</span>
              <span>{formatPool(market.noPool)} USDC</span>
            </div>
          </div>
        </div>

        {market.status === 'open' && (
          <div className="bet-section">
            <div style={{ marginBottom: '16px', fontWeight: '600' }}>
              Place Your Bet
            </div>

            {isExpired ? (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                background: 'rgba(242, 201, 76, 0.1)',
                border: '1px solid rgba(242, 201, 76, 0.3)',
                borderRadius: '12px',
                color: 'var(--warning)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏰</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Betting Closed</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>
                  This market has expired and is awaiting resolution by admin.
                </div>
              </div>
            ) : !isConnected ? (
              <button
                className="btn btn-primary btn-full btn-press"
                onClick={() => connect({ connector: connectors[0] })}
              >
                Connect Wallet to Bet
              </button>
            ) : (
              <>
                {/* Show USDC balance */}
                <div style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Balance: {parseFloat(balance).toFixed(2)} USDC
                </div>

                <div className="quick-amounts">
                  {['5', '10', '25', '50', '100'].map(amt => (
                    <button
                      key={amt}
                      className={`quick-amount btn-press ${betAmount === amt ? 'active' : ''}`}
                      onClick={() => setBetAmount(amt)}
                    >
                      ${amt}
                    </button>
                  ))}
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Enter amount"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      min="1"
                    />
                    <span className="input-suffix">USDC</span>
                  </div>
                </div>

                {betAmount && parseFloat(betAmount) > 0 && (
                  <div className="payout-preview" style={{ marginBottom: '12px' }}>
                    <div className="payout-row">
                      <span className="payout-label">If YES wins</span>
                      <span className="payout-value yes">
                        {calculatePayout(parseFloat(betAmount), 'yes').toFixed(2)} USDC
                      </span>
                    </div>
                    <div className="payout-row">
                      <span className="payout-label">If NO wins</span>
                      <span className="payout-value no">
                        {calculatePayout(parseFloat(betAmount), 'no').toFixed(2)} USDC
                      </span>
                    </div>
                  </div>
                )}

                <div className="bet-buttons">
                  <button
                    className={`btn ${betSide === 'yes' ? 'btn-success' : 'btn-secondary'} btn-press`}
                    onClick={() => handleBet('yes')}
                    disabled={!betAmount || isSubmitting || isBetting || isApproving}
                  >
                    {(isSubmitting || isBetting || isApproving) && betSide === 'yes'
                      ? (isApproving ? 'Approving...' : 'Betting...')
                      : 'Bet YES'}
                  </button>
                  <button
                    className={`btn ${betSide === 'no' ? 'btn-error' : 'btn-secondary'} btn-press`}
                    onClick={() => handleBet('no')}
                    disabled={!betAmount || isSubmitting || isBetting || isApproving}
                  >
                    {(isSubmitting || isBetting || isApproving) && betSide === 'no'
                      ? (isApproving ? 'Approving...' : 'Betting...')
                      : 'Bet NO'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {market.status === 'resolved' && isConnected && (
          <div className="bet-section">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Market Resolved: {market.outcomeYes ? 'YES' : 'NO'}
              </div>

              {claimResult?.claimed ? (
                <div style={{
                  background: 'var(--success)',
                  color: 'white',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>Winnings Claimed!</div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>{claimResult.payout.toFixed(2)} USDC</div>
                </div>
              ) : userWinningBet ? (
                <>
                  <div style={{
                    background: 'var(--bg-secondary)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Your Winnings</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>
                      {userWinningBet.payout?.toFixed(2)} USDC
                    </div>
                  </div>
                  <button
                    className="btn btn-primary btn-full btn-press"
                    onClick={handleClaim}
                    disabled={isClaiming}
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Winnings'}
                  </button>
                </>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  No winnings to claim for this market.
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showShareModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '600' }}>Share Market</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: '16px' }}>
              <div className="share-card" style={{ marginBottom: '16px' }}>
                <div className="share-card-header">
                  <span>📝</span>
                  <span>VOUCHEO</span>
                </div>
                <div className="share-card-question">{market.question}</div>
                <div className="odds-bar" style={{ height: '32px', marginBottom: '12px' }}>
                  <div className="odds-yes" style={{ width: `${yesPercent}%` }}>YES {yesPercent}%</div>
                  <div className="odds-no" style={{ width: `${noPercent}%` }}>NO {noPercent}%</div>
                </div>
                <div className="share-card-stats">
                  <span>💰 {formatPool(totalPool)} USDC</span>
                  <span>⏰ {timeLeftDisplay}</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-full btn-press"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  setShowShareModal(false)
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="home" />
    </div>
  )
}
