'use client'

import { useEffect, useState } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
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

  // Check if contract is configured
  const contractConfigured = isContractConfigured(CONTRACTS.PREDICTION_MARKETS)

  // Get total market count
  const { data: marketCount, refetch: refetchCount } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKETS,
    abi: PREDICTION_MARKETS_ABI,
    functionName: 'marketCount',
    query: {
      enabled: contractConfigured,
    },
  })

  // Fetch all markets when count changes
  useEffect(() => {
    const fetchMarkets = async () => {
      if (!contractConfigured || !marketCount) {
        setMarkets([])
        setIsLoading(false)
        return
      }

      const count = Number(marketCount)
      if (count === 0) {
        setMarkets([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        // We'll fetch markets one by one (for simplicity)
        // In production, you'd use multicall
        const fetchedMarkets: OnChainMarket[] = []

        for (let i = 1; i <= count; i++) {
          try {
            const response = await fetch(
              `https://sepolia.base.org`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_call',
                  params: [
                    {
                      to: CONTRACTS.PREDICTION_MARKETS,
                      data: encodeGetMarket(i),
                    },
                    'latest',
                  ],
                  id: i,
                }),
              }
            )

            const result = await response.json()
            if (result.result && result.result !== '0x') {
              const market = decodeMarketResult(result.result, i)
              if (market) {
                fetchedMarkets.push(market)
              }
            }
          } catch (err) {
            console.error(`Error fetching market ${i}:`, err)
          }
        }

        setMarkets(fetchedMarkets.reverse()) // Newest first
      } catch (error) {
        console.error('Error fetching markets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMarkets()
  }, [marketCount, contractConfigured])

  return {
    markets,
    isLoading,
    marketCount: marketCount ? Number(marketCount) : 0,
    refetch: refetchCount,
    contractConfigured,
  }
}

// Encode getMarket function call
function encodeGetMarket(marketId: number): string {
  // Function selector for getMarket(uint256)
  const selector = '0x3a057ac1' // keccak256("getMarket(uint256)").slice(0, 10)
  const paddedId = marketId.toString(16).padStart(64, '0')
  return selector + paddedId
}

// Decode getMarket result
function decodeMarketResult(data: string, marketId: number): OnChainMarket | null {
  try {
    // Remove 0x prefix
    const hex = data.slice(2)
    
    // The result is: (string question, uint64 deadline, bool resolved, bool outcomeYes, uint256 yesPool, uint256 noPool)
    // String is at offset position, then deadline, resolved, outcomeYes, yesPool, noPool
    
    // For dynamic types like string, first 32 bytes is offset
    const questionOffset = parseInt(hex.slice(0, 64), 16) * 2
    const deadline = parseInt(hex.slice(64, 128), 16)
    const resolved = parseInt(hex.slice(128, 192), 16) === 1
    const outcomeYes = parseInt(hex.slice(192, 256), 16) === 1
    const yesPool = BigInt('0x' + hex.slice(256, 320))
    const noPool = BigInt('0x' + hex.slice(320, 384))
    
    // Decode string
    const stringLength = parseInt(hex.slice(questionOffset, questionOffset + 64), 16)
    const stringHex = hex.slice(questionOffset + 64, questionOffset + 64 + stringLength * 2)
    const question = decodeHexString(stringHex)

    // Determine status
    const now = Date.now()
    const deadlineMs = deadline * 1000
    let status: 'open' | 'locked' | 'resolved' = 'open'
    if (resolved) {
      status = 'resolved'
    } else if (now > deadlineMs) {
      status = 'locked'
    }

    return {
      id: marketId,
      question,
      deadline: deadlineMs,
      resolved,
      outcomeYes,
      yesPool: parseFloat(formatUnits(yesPool, 6)),
      noPool: parseFloat(formatUnits(noPool, 6)),
      status,
    }
  } catch (error) {
    console.error('Error decoding market:', error)
    return null
  }
}

// Decode hex string to UTF-8
function decodeHexString(hex: string): string {
  let str = ''
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.slice(i, i + 2), 16)
    if (charCode === 0) break // Stop at null character
    str += String.fromCharCode(charCode)
  }
  return str
}

