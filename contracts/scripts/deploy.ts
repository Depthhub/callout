import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // USDC addresses
  const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const USDC_BASE_MAINNET = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Use testnet USDC by default
  const usdcAddress = process.env.USDC_ADDRESS || USDC_BASE_SEPOLIA;

  // Bet limits (in USDC with 6 decimals)
  const minBetSize = ethers.parseUnits("1", 6);    // 1 USDC minimum
  const maxBetSize = ethers.parseUnits("1000", 6); // 1000 USDC maximum

  console.log("Deploying PredictionMarkets...");
  console.log("  USDC:", usdcAddress);
  console.log("  Min bet:", ethers.formatUnits(minBetSize, 6), "USDC");
  console.log("  Max bet:", ethers.formatUnits(maxBetSize, 6), "USDC");

  const PredictionMarkets = await ethers.getContractFactory("PredictionMarkets");
  const markets = await PredictionMarkets.deploy(
    usdcAddress,
    minBetSize,
    maxBetSize
  );

  await markets.waitForDeployment();

  const address = await markets.getAddress();
  console.log("\nPredictionMarkets deployed to:", address);
  console.log("\nUpdate your .env.local with:");
  console.log(`NEXT_PUBLIC_MARKETS_ADDRESS=${address}`);

  // Verify contract
  console.log("\nTo verify on BaseScan:");
  console.log(`npx hardhat verify --network baseSepolia ${address} ${usdcAddress} ${minBetSize} ${maxBetSize}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
