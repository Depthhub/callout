// ============================================================
// Contract Configuration - BASE SEPOLIA TESTNET ONLY
// ============================================================
// SECURITY NOTES:
// - These addresses are for Base Sepolia testnet (Chain ID: 84532)
// - DO NOT use mainnet addresses here
// - Always verify addresses before deployment
// ============================================================

// Base Sepolia USDC (Official testnet token)
const BASE_SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

// Validate address format
function validateAddress(address: string | undefined, name: string): `0x${string}` {
  if (!address || address === '') {
    // Return zero address for unconfigured contracts (will be disabled in UI)
    return '0x0000000000000000000000000000000000000000'
  }
  
  // Basic validation: must start with 0x and be 42 characters
  if (!address.startsWith('0x') || address.length !== 42) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Config] Invalid ${name} address format: ${address}`)
    }
    return '0x0000000000000000000000000000000000000000'
  }
  
  return address as `0x${string}`
}

// Contract addresses - TESTNET ONLY
export const CONTRACTS = {
  // PredictionMarkets contract address on Base Sepolia
  // Must be set via NEXT_PUBLIC_MARKETS_ADDRESS environment variable
  PREDICTION_MARKETS: validateAddress(
    process.env.NEXT_PUBLIC_MARKETS_ADDRESS,
    'PREDICTION_MARKETS'
  ),
  
  // USDC token address on Base Sepolia
  // Uses official Base Sepolia USDC by default
  USDC: validateAddress(
    process.env.NEXT_PUBLIC_USDC_ADDRESS || BASE_SEPOLIA_USDC,
    'USDC'
  ),
}

// Check if contracts are properly configured
export const isContractConfigured = (address: `0x${string}`): boolean => {
  return address !== '0x0000000000000000000000000000000000000000'
}

// Export chain info for reference
export const CHAIN_CONFIG = {
  name: 'Base Sepolia',
  chainId: 84532,
  blockExplorer: 'https://sepolia.basescan.org',
} as const

// PredictionMarkets ABI (only the functions we need)
export const PREDICTION_MARKETS_ABI = [
  // Read functions
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'getMarket',
    outputs: [
      { name: 'question', type: 'string' },
      { name: 'deadline', type: 'uint64' },
      { name: 'resolved', type: 'bool' },
      { name: 'outcomeYes', type: 'bool' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'getOdds',
    outputs: [
      { name: 'yesPercent', type: 'uint256' },
      { name: 'noPercent', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'getUserStakes',
    outputs: [
      { name: 'yesStake', type: 'uint256' },
      { name: 'noStake', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'calculatePayout',
    outputs: [{ name: 'payout', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'marketCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'minBetSize',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxBetSize',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'platformFeeBps',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'accumulatedFees',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' },
    ],
    name: 'calculatePayoutAfterFee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'deadline', type: 'uint64' },
    ],
    name: 'createMarket',
    outputs: [{ name: 'marketId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'betYes',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'betNo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'claim',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'outcomeYes', type: 'bool' },
    ],
    name: 'resolveMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'to', type: 'address' }],
    name: 'withdrawFees',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'newFeeBps', type: 'uint256' }],
    name: 'setFee',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'marketId', type: 'uint256' },
      { indexed: false, name: 'question', type: 'string' },
      { indexed: false, name: 'deadline', type: 'uint64' },
      { indexed: true, name: 'creator', type: 'address' },
    ],
    name: 'MarketCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'marketId', type: 'uint256' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'isYes', type: 'bool' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'BetPlaced',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'marketId', type: 'uint256' },
      { indexed: false, name: 'outcomeYes', type: 'bool' },
    ],
    name: 'MarketResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'marketId', type: 'uint256' },
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    name: 'Claimed',
    type: 'event',
  },
] as const

// ERC20 ABI for USDC approval
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
