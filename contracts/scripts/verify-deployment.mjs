import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract details
const CONTRACT_ADDRESS = '0xB4219EE9b7b49d6Cc961F66c1962eDA692f5F551';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Minimal ABI for testing
const PREDICTION_MARKETS_ABI = [
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
        name: 'platformFeeBps',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
];

async function verifyContract() {
    console.log('🔍 Verifying PredictionMarkets Contract...\n');

    // Create public client
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http(),
    });

    try {
        // Test 1: Read market count
        console.log('📊 Test 1: Reading market count...');
        const marketCount = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: PREDICTION_MARKETS_ABI,
            functionName: 'marketCount',
        });
        console.log(`✅ Market count: ${marketCount}`);
        console.log(`   (${marketCount === 0n ? 'No markets created yet' : `${marketCount} markets exist`})\n`);

        // Test 2: Read min bet size
        console.log('💰 Test 2: Reading min bet size...');
        const minBetSize = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: PREDICTION_MARKETS_ABI,
            functionName: 'minBetSize',
        });
        const minBetUSDC = Number(minBetSize) / 1_000_000; // Convert from 6 decimals
        console.log(`✅ Min bet size: ${minBetUSDC} USDC\n`);

        // Test 3: Read platform fee
        console.log('💸 Test 3: Reading platform fee...');
        const feeBps = await client.readContract({
            address: CONTRACT_ADDRESS,
            abi: PREDICTION_MARKETS_ABI,
            functionName: 'platformFeeBps',
        });
        const feePercent = Number(feeBps) / 100;
        console.log(`✅ Platform fee: ${feePercent}%\n`);

        // Summary
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ CONTRACT VERIFICATION SUCCESSFUL!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n📍 Contract Address: ${CONTRACT_ADDRESS}`);
        console.log(`🌐 Network: Base Sepolia (Chain ID: 84532)`);
        console.log(`🔗 Explorer: https://sepolia.basescan.org/address/${CONTRACT_ADDRESS}`);
        console.log(`\n📈 Contract Stats:`);
        console.log(`   - Markets: ${marketCount}`);
        console.log(`   - Min Bet: ${minBetUSDC} USDC`);
        console.log(`   - Fee: ${feePercent}%`);
        console.log(`\n✅ Your app is ready to use!`);
        console.log(`   Local: http://localhost:3001`);
        console.log(`\n🚀 Next steps:`);
        console.log(`   1. Open http://localhost:3001 in your browser`);
        console.log(`   2. Connect your wallet (Base Sepolia)`);
        console.log(`   3. Create a test market`);
        console.log(`   4. Update Vercel with: NEXT_PUBLIC_MARKETS_ADDRESS=${CONTRACT_ADDRESS}`);

    } catch (error) {
        console.error('❌ Error verifying contract:');
        console.error(error);
        console.log('\n⚠️  Possible issues:');
        console.log('   - Contract not deployed correctly');
        console.log('   - Network connectivity issues');
        console.log('   - Wrong contract address');
    }
}

verifyContract();
