import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // USDC addresses
  const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  // Use testnet USDC
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
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: address,
    network: "baseSepolia",
    chainId: 84532,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    usdcAddress,
    minBetSize: ethers.formatUnits(minBetSize, 6),
    maxBetSize: ethers.formatUnits(maxBetSize, 6),
  };

  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ PredictionMarkets deployed to:", address);
  console.log("\n📝 Deployment info saved to deployment-info.json");
  console.log("\n🔧 Update your .env.local with:");
  console.log(`NEXT_PUBLIC_MARKETS_ADDRESS=${address}`);
  console.log("\n🔍 To verify on BaseScan:");
  console.log(`npx hardhat verify --network baseSepolia ${address} ${usdcAddress} ${minBetSize} ${maxBetSize}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
