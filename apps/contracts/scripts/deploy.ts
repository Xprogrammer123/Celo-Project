import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log(
    "Balance:",
    ethers.formatEther(
      await ethers.provider.getBalance(deployer.address)
    ),
    "CELO"
  );

  const LootScratch = await ethers.getContractFactory("LootScratch");
  const contract = await LootScratch.deploy(); // no constructor args needed

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ LootScratch deployed to:", address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});