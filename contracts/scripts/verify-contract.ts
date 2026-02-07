import { ethers } from "hardhat";

async function main() {
    console.log('🔍 Verifying PredictionMarkets Contract...\n');

    const CONTRACT_ADDRESS = '0xB4219EE9b7b49d6Cc961F66c1962eDA692f5F551';

    // Get contract instance
    const PredictionMarkets = await ethers.getContractAt(
        "PredictionMarkets",
        CONTRACT_ADDRESS
    );

    try {
        // Test 1: Read market count
        console.log('📊 Test 1: Reading market count...');
        const marketCount = await PredictionMarkets.marketCount();
        console.log(`✅ Market count: ${marketCount}`);
        console.log(`   (${marketCount === 0n ? 'No markets created yet' : `${marketCount} markets exist`})\n`);

        // Test 2: Read min bet size
        console.log('💰 Test 2: Reading min bet size...');
        const minBetSize = await PredictionMarkets.minBetSize();
        const minBetUSDC = ethers.formatUnits(minBetSize, 6);
        console.log(`✅ Min bet size: ${minBetUSDC} USDC\n`);

        // Test 3: Read platform fee
        console.log('💸 Test 3: Reading platform fee...');
        const feeBps = await PredictionMarkets.platformFeeBps();
        const feePercent = Number(feeBps) / 100;
        console.log(`✅ Platform fee: ${feePercent}%\n`);

        // Test 4: Read token address
        console.log('🪙 Test 4: Reading USDC token address...');
        const tokenAddress = await PredictionMarkets.token();
        console.log(`✅ USDC Address: ${tokenAddress}\n`);

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
        console.log(`   - USDC: ${tokenAddress}`);
        console.log(`\n✅ Your contract is live and working!`);
        console.log(`\n🚀 Next steps:`);
        console.log(`   1. Update Vercel environment variable:`);
        console.log(`      NEXT_PUBLIC_MARKETS_ADDRESS=${CONTRACT_ADDRESS}`);
        console.log(`   2. Redeploy your Vercel app`);
        console.log(`   3. Test locally at http://localhost:3001`);
        console.log(`   4. Get testnet tokens:`);
        console.log(`      - ETH: https://portal.cdp.coinbase.com/products/faucet`);
        console.log(`      - USDC: https://faucet.circle.com/`);

    } catch (error) {
        console.error('❌ Error verifying contract:');
        console.error(error);
        console.log('\n⚠️  Possible issues:');
        console.log('   - Contract not deployed correctly');
        console.log('   - Network connectivity issues');
        console.log('   - Wrong contract address');
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
