'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

// Platform type
export type Platform = 'base' | 'twitter'

// Market type
export interface Market {
  id: number
  question: string
  postUrl: string
  authorHandle: string
  postText: string
  postedAt?: string
  platform: Platform
  deadline: number
  status: 'open' | 'locked' | 'resolved'
  outcomeYes: boolean
  yesPool: number
  noPool: number
  creatorAddress?: string
}

// User bet type
export interface UserBet {
  marketId: number
  question: string
  side: 'yes' | 'no'
  stake: number
  status: 'open' | 'won' | 'lost'
  payout?: number
  claimed?: boolean
}

// Portfolio history entry for chart
export interface PortfolioHistoryEntry {
  timestamp: number
  balance: number
  action: 'bet' | 'claim' | 'initial'
  amount: number
  marketId?: number
}

// Initial demo markets
const INITIAL_MARKETS: Market[] = [
  {
    id: 1,
    question: 'Will ETH flip BTC market cap this cycle?',
    postUrl: 'https://base.org/post/abc123',
    authorHandle: '@vitalik.eth',
    postText: 'The flippening narrative is heating up again. With the ETH/BTC ratio climbing and institutional interest growing, this cycle might finally be the one.',
    postedAt: '4h ago',
    platform: 'base',
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
    status: 'open',
    outcomeYes: false,
    yesPool: 45200,
    noPool: 38100,
  },
  {
    id: 2,
    question: 'Will Base reach 100M users by end of 2025?',
    postUrl: 'https://base.org/post/def456',
    authorHandle: '@jessepollak',
    postText: 'Base is growing faster than any L2 in history. We just crossed 10M weekly active users. The path to 100M is clearer than ever.',
    postedAt: '1d ago',
    platform: 'base',
    deadline: Date.now() + 180 * 24 * 60 * 60 * 1000,
    status: 'open',
    outcomeYes: false,
    yesPool: 78500,
    noPool: 22300,
  },
  {
    id: 3,
    question: 'Will BTC reach $150k this year?',
    postUrl: 'https://twitter.com/saylor/status/123456789',
    authorHandle: '@saylor',
    postText: 'Bitcoin is the apex property of the human race. $150k is just a milestone on the path to millions. Stack sats.',
    postedAt: '2d ago',
    platform: 'twitter',
    deadline: Date.now() + 90 * 24 * 60 * 60 * 1000,
    status: 'open',
    outcomeYes: false,
    yesPool: 125000,
    noPool: 45000,
  },
  {
    id: 4,
    question: 'Will SOL outperform ETH in Q1 2025?',
    postUrl: 'https://twitter.com/aaboronkov/status/987654321',
    authorHandle: '@aeyakovenko',
    postText: 'Solana is shipping faster than anyone. The Firedancer upgrade will change everything. Q1 2025 is our moment.',
    postedAt: '3w ago',
    platform: 'twitter',
    deadline: Date.now() - 10 * 24 * 60 * 60 * 1000,
    status: 'resolved',
    outcomeYes: false,
    yesPool: 32000,
    noPool: 41000,
  },
  {
    id: 5,
    question: 'Will Apple announce AR glasses at WWDC?',
    postUrl: 'https://twitter.com/markgurman/status/111222333',
    authorHandle: '@markgurman',
    postText: 'Sources say Apple is ready to unveil their long-awaited AR glasses. The device will revolutionize how we interact with technology.',
    postedAt: '5d ago',
    platform: 'twitter',
    deadline: Date.now() - 2 * 24 * 60 * 60 * 1000,
    status: 'open',
    outcomeYes: false,
    yesPool: 18500,
    noPool: 22000,
  },
  {
    id: 6,
    question: 'Will Trump mention crypto in his first 100 days?',
    postUrl: 'https://twitter.com/realDonaldTrump/status/999888777',
    authorHandle: '@realDonaldTrump',
    postText: 'We are going to make America the crypto capital of the world. No more regulations killing innovation!',
    postedAt: '1h ago',
    platform: 'twitter',
    deadline: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago - READY TO RESOLVE
    status: 'open',
    outcomeYes: false,
    yesPool: 50000,
    noPool: 25000,
  },
]

// Initial demo user bets
const INITIAL_BETS: UserBet[] = [
  {
    marketId: 1,
    question: 'Will ETH flip BTC market cap this cycle?',
    side: 'yes',
    stake: 50,
    status: 'open',
  },
  {
    marketId: 3,
    question: 'Will BTC reach $150k this year?',
    side: 'no',
    stake: 25,
    status: 'open',
  },
  {
    marketId: 4,
    question: 'Will SOL outperform ETH in Q1 2025?',
    side: 'no',
    stake: 30,
    status: 'won',
    payout: 52,
  },
  {
    marketId: 5,
    question: 'Will Apple announce AR glasses at WWDC?',
    side: 'yes',
    stake: 40,
    status: 'open',
  },
  {
    marketId: 6,
    question: 'Will Trump mention crypto in his first 100 days?',
    side: 'yes',
    stake: 100,
    status: 'open', // Ready to resolve - you bet YES with 100 USDC
  },
]

interface MarketsContextType {
  markets: Market[]
  userBets: UserBet[]
  portfolioBalance: number
  portfolioHistory: PortfolioHistoryEntry[]
  totalWinnings: number
  totalStaked: number
  addMarket: (market: Omit<Market, 'id' | 'status' | 'outcomeYes' | 'yesPool' | 'noPool'> & { initialStake: number; platform: Platform }) => number
  addBet: (marketId: number, side: 'yes' | 'no', stake: number) => void
  getMarket: (id: number) => Market | undefined
  resolveMarket: (marketId: number, outcomeYes: boolean) => Promise<void>
  claimWinnings: (marketId: number) => Promise<{ payout: number; claimed: boolean }>
  getUserBetsForMarket: (marketId: number) => UserBet[]
}

const MarketsContext = createContext<MarketsContextType | null>(null)

// LocalStorage keys
const STORAGE_KEYS = {
  MARKETS: 'voucheo_markets',
  BETS: 'voucheo_bets',
  NEXT_ID: 'voucheo_next_id',
  PORTFOLIO_BALANCE: 'voucheo_portfolio_balance',
  PORTFOLIO_HISTORY: 'voucheo_portfolio_history',
}

// Initial portfolio balance (demo)
const INITIAL_PORTFOLIO_BALANCE = 1000 // Start with 1000 USDC

// Initial portfolio history
const INITIAL_PORTFOLIO_HISTORY: PortfolioHistoryEntry[] = [
  { timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, balance: 1000, action: 'initial', amount: 1000 },
  { timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, balance: 950, action: 'bet', amount: -50, marketId: 1 },
  { timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000, balance: 925, action: 'bet', amount: -25, marketId: 3 },
  { timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, balance: 895, action: 'bet', amount: -30, marketId: 4 },
  { timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000, balance: 947, action: 'claim', amount: 52, marketId: 4 },
]

// Helper to load from localStorage
function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

export function MarketsProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>(INITIAL_MARKETS)
  const [userBets, setUserBets] = useState<UserBet[]>(INITIAL_BETS)
  const [nextId, setNextId] = useState(100)
  const [portfolioBalance, setPortfolioBalance] = useState(INITIAL_PORTFOLIO_BALANCE)
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryEntry[]>(INITIAL_PORTFOLIO_HISTORY)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const storedMarkets = loadFromStorage<Market[]>(STORAGE_KEYS.MARKETS, INITIAL_MARKETS)
    const storedBets = loadFromStorage<UserBet[]>(STORAGE_KEYS.BETS, INITIAL_BETS)
    const storedNextId = loadFromStorage<number>(STORAGE_KEYS.NEXT_ID, 100)
    const storedBalance = loadFromStorage<number>(STORAGE_KEYS.PORTFOLIO_BALANCE, INITIAL_PORTFOLIO_BALANCE)
    const storedHistory = loadFromStorage<PortfolioHistoryEntry[]>(STORAGE_KEYS.PORTFOLIO_HISTORY, INITIAL_PORTFOLIO_HISTORY)

    setMarkets(storedMarkets)
    setUserBets(storedBets)
    setNextId(storedNextId)
    setPortfolioBalance(storedBalance)
    setPortfolioHistory(storedHistory)
    setIsHydrated(true)
  }, [])

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(markets))
  }, [markets, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEYS.BETS, JSON.stringify(userBets))
  }, [userBets, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEYS.NEXT_ID, JSON.stringify(nextId))
  }, [nextId, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_BALANCE, JSON.stringify(portfolioBalance))
  }, [portfolioBalance, isHydrated])

  useEffect(() => {
    if (!isHydrated) return
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_HISTORY, JSON.stringify(portfolioHistory))
  }, [portfolioHistory, isHydrated])

  // Calculate total winnings and total staked
  const totalWinnings = userBets
    .filter(bet => bet.status === 'won' && bet.claimed)
    .reduce((sum, bet) => sum + (bet.payout || 0), 0)

  const totalStaked = userBets
    .filter(bet => bet.status === 'open')
    .reduce((sum, bet) => sum + bet.stake, 0)

  const addMarket = useCallback((
    marketData: Omit<Market, 'id' | 'status' | 'outcomeYes' | 'yesPool' | 'noPool'> & { initialStake: number; platform: Platform }
  ): number => {
    const newId = nextId
    const newMarket: Market = {
      id: newId,
      question: marketData.question,
      postUrl: marketData.postUrl,
      authorHandle: marketData.authorHandle,
      postText: marketData.postText,
      postedAt: marketData.postedAt,
      platform: marketData.platform,
      deadline: marketData.deadline,
      status: 'open',
      outcomeYes: false,
      yesPool: marketData.initialStake,
      noPool: 0,
      creatorAddress: marketData.creatorAddress,
    }
    
    setMarkets(prev => [newMarket, ...prev])
    setNextId(prev => prev + 1)

    // Also add creator's bet
    const creatorBet: UserBet = {
      marketId: newId,
      question: marketData.question,
      side: 'yes',
      stake: marketData.initialStake,
      status: 'open',
    }
    setUserBets(prev => [creatorBet, ...prev])

    return newId
  }, [nextId])

  const addBet = useCallback((marketId: number, side: 'yes' | 'no', stake: number) => {
    // Update market pools
    setMarkets(prev => prev.map(m => {
      if (m.id === marketId) {
        return {
          ...m,
          yesPool: side === 'yes' ? m.yesPool + stake : m.yesPool,
          noPool: side === 'no' ? m.noPool + stake : m.noPool,
        }
      }
      return m
    }))

    // Add user bet
    const market = markets.find(m => m.id === marketId)
    if (market) {
      const newBet: UserBet = {
        marketId,
        question: market.question,
        side,
        stake,
        status: 'open',
      }
      setUserBets(prev => [newBet, ...prev])

      // Update portfolio balance and history
      setPortfolioBalance(prev => prev - stake)
      setPortfolioHistory(prev => [
        ...prev,
        {
          timestamp: Date.now(),
          balance: portfolioBalance - stake,
          action: 'bet',
          amount: -stake,
          marketId,
        }
      ])
    }
  }, [markets, portfolioBalance])

  const getMarket = useCallback((id: number): Market | undefined => {
    return markets.find(m => m.id === id)
  }, [markets])

  const resolveMarket = useCallback(async (marketId: number, outcomeYes: boolean): Promise<void> => {
    // In production, this would call the smart contract's resolveMarket function
    // For now, we update the local state

    // Find the market
    const market = markets.find(m => m.id === marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    // Update market status
    setMarkets(prev => prev.map(m => {
      if (m.id === marketId) {
        return {
          ...m,
          status: 'resolved' as const,
          outcomeYes,
        }
      }
      return m
    }))

    // Update user bets for this market
    const totalPool = market.yesPool + market.noPool
    const winningPool = outcomeYes ? market.yesPool : market.noPool

    setUserBets(prev => prev.map(bet => {
      if (bet.marketId === marketId && bet.status === 'open') {
        const won = (bet.side === 'yes' && outcomeYes) || (bet.side === 'no' && !outcomeYes)
        const payout = won ? (bet.stake / winningPool) * totalPool : 0

        return {
          ...bet,
          status: won ? 'won' as const : 'lost' as const,
          payout: won ? Math.round(payout * 100) / 100 : 0,
        }
      }
      return bet
    }))
  }, [markets])

  const getUserBetsForMarket = useCallback((marketId: number): UserBet[] => {
    return userBets.filter(bet => bet.marketId === marketId)
  }, [userBets])

  const claimWinnings = useCallback(async (marketId: number): Promise<{ payout: number; claimed: boolean }> => {
    // Find user's winning bet for this market
    const winningBet = userBets.find(
      bet => bet.marketId === marketId && bet.status === 'won' && bet.payout && bet.payout > 0 && !bet.claimed
    )

    if (!winningBet) {
      return { payout: 0, claimed: false }
    }

    const payout = winningBet.payout || 0

    // Update the bet to show it's been claimed
    setUserBets(prev => prev.map(bet => {
      if (bet.marketId === marketId && bet.status === 'won' && !bet.claimed) {
        return {
          ...bet,
          claimed: true,
        }
      }
      return bet
    }))

    // Add winnings to portfolio balance
    const newBalance = portfolioBalance + payout
    setPortfolioBalance(newBalance)

    // Add to portfolio history for chart
    setPortfolioHistory(prev => [
      ...prev,
      {
        timestamp: Date.now(),
        balance: newBalance,
        action: 'claim',
        amount: payout,
        marketId,
      }
    ])

    return { payout, claimed: true }
  }, [userBets, portfolioBalance])

  return (
    <MarketsContext.Provider value={{
      markets,
      userBets,
      portfolioBalance,
      portfolioHistory,
      totalWinnings,
      totalStaked,
      addMarket,
      addBet,
      getMarket,
      resolveMarket,
      claimWinnings,
      getUserBetsForMarket
    }}>
      {children}
    </MarketsContext.Provider>
  )
}

export function useMarkets() {
  const context = useContext(MarketsContext)
  if (!context) {
    throw new Error('useMarkets must be used within a MarketsProvider')
  }
  return context
}


