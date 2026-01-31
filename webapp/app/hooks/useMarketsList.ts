'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { formatUnits } from 'viem'
import { CONTRACTS, PREDICTION_MARKETS_ABI, isContractConfigured } from '../contracts/config'

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
  
  const publicClient = usePublicClient()
  const contractConfigured = isContractConfigured(CONTRACTS.PREDICTION_MARKETS)

  console.log('[useMarketsList] Contract:', CONTRACTS.PREDICTION_MARKETS)
  console.log('[useMarketsList] Configured:', contractConfigured)
  console.log('[useMarketsList] PublicClient:', !!publicClient)

  // Fetch markets
  useEffect(() => {
    const fetchAllMarkets = async () => {
      console.log('[useMarketsList] Starting fetch...')
      
      if (!contractConfigured) {
        console.error('[useMarketsList] Contract not configured!')
        setError('Contract address not set')
        setMarkets([])
        setIsLoading(false)
        return
      }

      if (!publicClient) {
        console.log('[useMarketsList] Waiting for publicClient...')
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('[useMarketsList] Reading marketCount...')
        
        // Get market count
        const count = await publicClient.readContract({
          address: CONTRACTS.PREDICTION_MARKETS,
          abi: PREDICTION_MARKETS_ABI,
          functionName: 'marketCount',
        }) as bigint

        const countNum = Number(count)
        console.log('[useMarketsList] Market count:', countNum)
        setMarketCount(countNum)

        if (countNum === 0) {
          console.log('[useMarketsList] No markets found')
          setMarkets([])
          setIsLoading(false)
          return
        }

        // Fetch each market
        const fetchedMarkets: OnChainMarket[]= []

        for (let i = 1; i <= countNum; i++) {
          try {
            console.log(`[useMarketsList] Fetching market ${i}...`)
            
            const data = await publicClient.readContract({
              address: CONTRACTS.PREDICTION_MARKETS,
              abi: PREDICTION_MARKETS_ABI,
              functionName: 'getMarket',
              args: [BigInt(i)],
            }) as [string, bigint, boolean, boolean, bigint, bigint]

            const [question, deadline, resolved, outcomeYes, yesPool, noPool] = data
            
            console.log(`[useMarketsList] Market ${i}:`, question)
            
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
            console.error(`[useMarketsList] Error fetching market ${i}:`, err)
            setError(`Failed to fetch market ${i}`)
          }
        }

        // Newest first
        fetchedMarkets.sort((a, b) => b.id - a.id)
        console.log(`[useMarketsList] Fetched ${fetchedMarkets.length} markets`)
        setMarkets(fetchedMarkets)
      } catch (err) {
        console.error('[useMarketsList] Error fetching markets:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch markets')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllMarkets()
    
    // Refetch every 5 seconds (faster refresh)
    const interval = setInterval(fetchAllMarkets, 5000)
    return () => clearInterval(interval)
  }, [publicClient, contractConfigured])

  return {
    markets,
    isLoading,
    marketCount,
    error,
    contractConfigured,
    refetch: () => {
      setIsLoading(true)
      // Will re-run useEffect
    },
  }
}
