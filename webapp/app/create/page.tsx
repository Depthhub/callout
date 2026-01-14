'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { Header } from '../components/Header'
import { BottomNav } from '../components/BottomNav'
import { PostPreviewCard } from '../components/PostPreviewCard'
import { useCreateMarket } from '../hooks/useContract'
import Link from 'next/link'

export type Platform = 'base' | 'twitter'

export default function CreateMarket() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { createMarket, isPending, isSuccess, hash } = useCreateMarket()

  const [platform, setPlatform] = useState<Platform>('base')
  const [postUrl, setPostUrl] = useState('')
  const [authorHandle, setAuthorHandle] = useState('')
  const [postText, setPostText] = useState('')
  const [postedAt, setPostedAt] = useState('')
  const [question, setQuestion] = useState('')
  const [deadline, setDeadline] = useState('')
  const [initialStake, setInitialStake] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form')
  const [createdMarketId, setCreatedMarketId] = useState<number | null>(null)

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const isValid = postUrl.length > 0 && authorHandle.length > 0 && postText.length > 0 && question.length > 0 && deadline && parseFloat(initialStake) >= 1

  // Watch for successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      setStep('success')
      setIsSubmitting(false)
    }
  }, [isSuccess, hash])

  const handleSubmit = async () => {
    if (!isValid || !isConnected) return
    
    setIsSubmitting(true)
    
    try {
      // Create market on-chain via smart contract
      const deadlineTimestamp = new Date(deadline).getTime()
      await createMarket(question, deadlineTimestamp)
      // Transaction submitted - useEffect will handle success
    } catch (error) {
      console.error('Failed to create market:', error)
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="app">
        <Header />
        <main className="app-content with-bottom-nav">
          <div className="page-header">
            <Link href="/" className="back-btn">←</Link>
            <h1 className="page-title">Create Market</h1>
          </div>

          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <div className="empty-title">Connect Wallet</div>
            <div className="empty-text">Connect your Base wallet to create a market.</div>
            <button 
              className="btn btn-primary btn-press"
              onClick={() => connect({ connector: connectors[0] })}
            >
              Connect Wallet
            </button>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="app">
        <Header />
        <main className="app-content with-bottom-nav">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">Market Created!</div>
            <div className="empty-text">
              Your market is now live. Share it to get others to bet.
            </div>

            <div className="share-card" style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div className="share-card-header">
                <span>📝</span>
                <span>VOUCHEO</span>
              </div>
              <div className="share-card-question">{question}</div>
              <div className="odds-bar" style={{ height: '32px', marginBottom: '12px' }}>
                <div className="odds-yes" style={{ width: '50%' }}>YES 50%</div>
                <div className="odds-no" style={{ width: '50%' }}>NO 50%</div>
              </div>
              <div className="share-card-stats">
                <span>💰 {initialStake} USDC</span>
                <span>⏰ {new Date(deadline).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href={`/market/${createdMarketId}`} className="btn btn-primary">
                View Market
              </Link>
              <button 
                className="btn btn-secondary btn-press"
                onClick={() => {
                  navigator.clipboard.writeText(`https://voucheo.app/market/${createdMarketId}`)
                }}
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="app">
      <Header />
      
      <main className="app-content with-bottom-nav">
        <div className="page-header">
          <Link href="/" className="back-btn">←</Link>
          <h1 className="page-title">Create Market</h1>
        </div>

        {step === 'form' && (
          <div>
            {/* Platform Selector */}
            <div className="form-group">
              <label className="form-label">Platform</label>
              <div className="platform-selector">
                <button
                  type="button"
                  className={`platform-option btn-press ${platform === 'base' ? 'active' : ''}`}
                  onClick={() => setPlatform('base')}
                >
                  <span className="platform-icon">🔵</span>
                  <span>Base</span>
                </button>
                <button
                  type="button"
                  className={`platform-option btn-press ${platform === 'twitter' ? 'active' : ''}`}
                  onClick={() => setPlatform('twitter')}
                >
                  <span className="platform-icon">𝕏</span>
                  <span>Twitter</span>
                </button>
              </div>
              <div className="form-hint">
                Choose where the original post was made
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{platform === 'twitter' ? 'Tweet URL' : 'Base Post URL'}</label>
              <input
                type="url"
                className="form-input"
                placeholder={platform === 'twitter' ? 'Paste Twitter/X post URL...' : 'Paste Base post URL...'}
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
              />
              <div className="form-hint">
                Reference the {platform === 'twitter' ? 'tweet' : 'post'} you want to create a market about
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Author Handle</label>
              <input
                type="text"
                className="form-input"
                placeholder="@username"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
              />
              <div className="form-hint">
                Who made the original post? (e.g. @vitalik.eth)
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Post Snippet</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Copy the key text from the post..."
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                maxLength={280}
              />
              <div className="form-hint">{postText.length}/280 characters</div>
            </div>

            <div className="form-group">
              <label className="form-label">Posted Time <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 2h ago, 1d ago, Jan 1"
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
              />
              <div className="form-hint">
                When was the original post made?
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">YES/NO Question</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Will this prediction come true?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={200}
              />
              <div className="form-hint">{question.length}/200 characters</div>
            </div>

            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                className="form-input"
                min={minDate}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <div className="form-hint">
                When should this market close for betting?
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Initial Stake (YES)</label>
              <div className="input-with-suffix">
                <input
                  type="number"
                  className="form-input"
                  placeholder="10"
                  min="1"
                  step="1"
                  value={initialStake}
                  onChange={(e) => setInitialStake(e.target.value)}
                />
                <span className="input-suffix">USDC</span>
              </div>
              <div className="form-hint">
                Your stake goes to the YES pool. Minimum 1 USDC.
              </div>
            </div>

            <button
              className="btn btn-primary btn-full btn-press"
              onClick={() => setStep('preview')}
              disabled={!isValid}
            >
              Preview Market
            </button>
          </div>
        )}

        {step === 'preview' && (
          <div>
            {/* Post Preview Card */}
            <div style={{ marginBottom: '16px' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>Referenced {platform === 'twitter' ? 'Tweet' : 'Post'}</div>
              <PostPreviewCard
                postUrl={postUrl}
                authorHandle={authorHandle}
                postText={postText}
                postedAt={postedAt || undefined}
                platform={platform}
              />
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-body">
                <div className="market-status open">🟢 Preview</div>
                <h3 className="market-question">{question}</h3>

                <div className="market-meta">
                  <span>💰 {initialStake} USDC</span>
                  <span>⏰ {new Date(deadline).toLocaleDateString()}</span>
                </div>

                <div className="odds-bar">
                  <div className="odds-yes" style={{ width: '100%' }}>YES 100%</div>
                </div>
                <div className="odds-stats">
                  <span>You're first! Others will bet NO to balance odds.</span>
                </div>
              </div>
            </div>

            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '16px', 
              borderRadius: '12px',
              marginBottom: '20px' 
            }}>
              <div style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-secondary)' }}>
                You're creating this market with:
              </div>
              <div className="payout-preview">
                <div className="payout-row">
                  <span className="payout-label">Initial Stake</span>
                  <span className="payout-value">{initialStake} USDC</span>
                </div>
                <div className="payout-row">
                  <span className="payout-label">Position</span>
                  <span className="payout-value yes">YES</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-secondary btn-press"
                onClick={() => setStep('form')}
                style={{ flex: 1 }}
              >
                ← Edit
              </button>
              <button
                className="btn btn-primary btn-press"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ flex: 2 }}
              >
                {isSubmitting ? 'Creating...' : `Create & Stake ${initialStake} USDC`}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

