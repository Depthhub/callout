'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPublicClient, http, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { CONTRACTS, PREDICTION_MARKETS_ABI, isContractConfigured } from '../contracts/config'

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
})

export interface OnChainMarket {
  id: number
  question: string
  deadline: number
  resolved: boolean
  outcomeYes: boolean
  yesPool: number
  noPool: number
  status: 'open' | 'locked' | 'resolved'
}

export function useMarketsList() {
  const [markets, setMarkets] = useState<OnChainMarket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [marketCount, setMarketCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const contractConfigured = isContractConfigured(CONTRACTS.PREDICTION_MARKETS)

  const fetchAllMarkets = useCallback(async () => {
    if (!contractConfigured) {
      setMarkets([])
      setIsLoading(false)
      setError('Contract not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const count = await publicClient.readContract({
        address: CONTRACTS.PREDICTION_MARKETS,
        abi: PREDICTION_MARKETS_ABI,
        functionName: 'marketCount',
      }) as bigint

      const countNum = Number(count)
      setMarketCount(countNum)

      if (countNum === 0) {
        setMarkets([])
        setIsLoading(false)
        return
      }

      const fetchedMarkets: OnChainMarket[] = []

      for (let i = 1; i <= countNum; i++) {
        try {
          const data = await publicClient.readContract({
            address: CONTRACTS.PREDICTION_MARKETS,
            abi: PREDICTION_MARKETS_ABI,
            functionName: 'getMarket',
            args: [BigInt(i)],
          }) as [string, bigint, boolean, boolean, bigint, bigint]

          const [question, deadline, resolved, outcomeYes, yesPool, noPool] = data
          
          const deadlineMs = Number(deadline) * 1000
          const now = Date.now()
          
          let status: 'open' | 'locked' | 'resolved' = 'open'
          if (resolved) {
            status = 'resolved'
          } else if (now > deadlineMs) {
            status = 'locked'
          }

          fetchedMarkets.push({
            id: i,
            question,
            deadline: deadlineMs,
            resolved,
            outcomeYes,
            yesPool: parseFloat(formatUnits(yesPool, 6)),
            noPool: parseFloat(formatUnits(noPool, 6)),
            status,
          })
        } catch (err) {
          console.error('Error fetching market', i, err)
        }
      }

      fetchedMarkets.sort((a, b) => b.id - a.id)
      setMarkets(fetchedMarkets)
    } catch (err) {
      console.error('Error fetching markets:', err)
      setError('Failed to load markets')
    } finally {
      setIsLoading(false)
    }
  }, [contractConfigured])

  useEffect(() => {
    fetchAllMarkets()
    const interval = setInterval(fetchAllMarkets, 10000)
    return () => clearInterval(interval)
  }, [fetchAllMarkets])

  return {
    markets,
    isLoading,
    error,
    marketCount,
    contractConfigured,
    refetch: fetchAllMarkets,
  }
}
