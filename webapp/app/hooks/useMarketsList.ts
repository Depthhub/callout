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
  
  const publicClient = usePublicClient()
  const contractConfigured = isContractConfigured(CONTRACTS.PREDICTION_MARKETS)

  // Fetch markets
  useEffect(() => {
    const fetchAllMarkets = async () => {
      if (!publicClient || !contractConfigured) {
        setMarkets([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // Get market count
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

        // Fetch each market
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
            console.error(`Error fetching market ${i}:`, err)
          }
        }

        // Newest first
        fetchedMarkets.sort((a, b) => b.id - a.id)
        setMarkets(fetchedMarkets)
      } catch (err) {
        console.error('Error fetching markets:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllMarkets()
    
    // Refetch every 10 seconds
    const interval = setInterval(fetchAllMarkets, 10000)
    return () => clearInterval(interval)
  }, [publicClient, contractConfigured])

  return {
    markets,
    isLoading,
    marketCount,
    contractConfigured,
    refetch: () => {
      // Trigger re-render by updating a dummy state
      setIsLoading(true)
    },
  }
}

