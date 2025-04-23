// This file should be saved as deploy.cjs
const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts to Monad testnet...");

  // Deploy MathScroll
  const MathScroll = await hre.ethers.getContractFactory("MathScroll");
  const mathScroll = await MathScroll.deploy();
  await mathScroll.waitForDeployment();
  
  const mathScrollAddress = await mathScroll.getAddress();
  console.log("MathScroll deployed to:", mathScrollAddress);

  // Save the contract address
  console.log("\nContract address to update in src/lib/monad.ts:");
  console.log(`const CONTRACT_ADDRESS = "${mathScrollAddress}";`);
}

// We recommend this pattern to be able to use async/await everywhere
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 