'use client'

import { useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { CONTRACTS, PREDICTION_MARKETS_ABI, ERC20_ABI } from '../contracts/config'

// Hook to read market data from contract
export function useMarketData(marketId: number) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKETS,
    abi: PREDICTION_MARKETS_ABI,
    functionName: 'getMarket',
    args: [BigInt(marketId)],
    query: {
      enabled: CONTRACTS.PREDICTION_MARKETS !== '0x0000000000000000000000000000000000000000',
    },
  })

  return {
    market: data ? {
      question: data[0],
      deadline: Number(data[1]),
      resolved: data[2],
      outcomeYes: data[3],
      yesPool: formatUnits(data[4], 6), // USDC has 6 decimals
      noPool: formatUnits(data[5], 6),
    } : null,
    isLoading,
    error,
    refetch,
  }
}

// Hook to read user's stakes in a market
export function useUserStakes(marketId: number) {
  const { address } = useAccount()

  const { data, isLoading, refetch } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKETS,
    abi: PREDICTION_MARKETS_ABI,
    functionName: 'getUserStakes',
    args: address ? [BigInt(marketId), address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.PREDICTION_MARKETS !== '0x0000000000000000000000000000000000000000',
    },
  })

  return {
    yesStake: data ? formatUnits(data[0], 6) : '0',
    noStake: data ? formatUnits(data[1], 6) : '0',
    isLoading,
    refetch,
  }
}

// Hook to get USDC balance and allowance
export function useUSDC() {
  const { address, isConnected } = useAccount()

  const { data: balance, refetch: refetchBalance, isLoading: isBalanceLoading } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
    },
  })

  const { data: allowance, refetch: refetchAllowance, isLoading: isAllowanceLoading } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.PREDICTION_MARKETS] : undefined,
    query: {
      enabled: !!address && isConnected && CONTRACTS.PREDICTION_MARKETS !== '0x0000000000000000000000000000000000000000',
      refetchInterval: 10000,
      staleTime: 5000,
    },
  })

  return {
    balance: balance ? formatUnits(balance, 6) : '0',
    allowance: allowance ? formatUnits(allowance, 6) : '0',
    refetchBalance,
    refetchAllowance,
    isLoading: isBalanceLoading || isAllowanceLoading,
  }
}

// Hook to place a bet
export function usePlaceBet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const placeBet = useCallback(async (
    marketId: number,
    isYes: boolean,
    amount: string // Amount in USDC (e.g., "10" for 10 USDC)
  ) => {
    const amountWei = parseUnits(amount, 6)

    writeContract({
      address: CONTRACTS.PREDICTION_MARKETS,
      abi: PREDICTION_MARKETS_ABI,
      functionName: isYes ? 'betYes' : 'betNo',
      args: [BigInt(marketId), amountWei],
    })
  }, [writeContract])

  return {
    placeBet,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook to approve USDC spending
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = useCallback(async (amount: string) => {
    const amountWei = parseUnits(amount, 6)

    writeContract({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.PREDICTION_MARKETS, amountWei],
    })
  }, [writeContract])

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook to create a market
export function useCreateMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createMarket = useCallback(async (question: string, deadline: number) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKETS,
      abi: PREDICTION_MARKETS_ABI,
      functionName: 'createMarket',
      args: [question, BigInt(Math.floor(deadline / 1000))], // Convert to seconds
    })
  }, [writeContract])

  return {
    createMarket,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook to claim winnings
export function useClaimWinnings() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claim = useCallback(async (marketId: number) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKETS,
      abi: PREDICTION_MARKETS_ABI,
      functionName: 'claim',
      args: [BigInt(marketId)],
    })
  }, [writeContract])

  return {
    claim,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook to resolve a market (admin only)
export function useResolveMarket() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const resolveMarket = useCallback(async (marketId: number, outcomeYes: boolean) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKETS,
      abi: PREDICTION_MARKETS_ABI,
      functionName: 'resolveMarket',
      args: [BigInt(marketId), outcomeYes],
    })
  }, [writeContract])

  return {
    resolveMarket,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// Hook to get platform fee info (admin)
export function usePlatformFees() {
  const { data: feeBps } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKETS,
    abi: PREDICTION_MARKETS_ABI,
    functionName: 'platformFeeBps',
    query: {
      enabled: CONTRACTS.PREDICTION_MARKETS !== '0x0000000000000000000000000000000000000000',
    },
  })

  const { data: accumulatedFees, refetch: refetchFees } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKETS,
    abi: PREDICTION_MARKETS_ABI,
    functionName: 'accumulatedFees',
    query: {
      enabled: CONTRACTS.PREDICTION_MARKETS !== '0x0000000000000000000000000000000000000000',
    },
  })

  return {
    feePercent: feeBps ? Number(feeBps) / 100 : 2, // Default 2%
    accumulatedFees: accumulatedFees ? formatUnits(accumulatedFees, 6) : '0',
    refetchFees,
  }
}

// Hook to withdraw platform fees (admin only)
export function useWithdrawFees() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdrawFees = useCallback(async (toAddress: `0x${string}`) => {
    writeContract({
      address: CONTRACTS.PREDICTION_MARKETS,
      abi: PREDICTION_MARKETS_ABI,
      functionName: 'withdrawFees',
      args: [toAddress],
    })
  }, [writeContract])

  return {
    withdrawFees,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}
