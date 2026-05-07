import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CELO");

  // ── Chainlink VRF v2.5 — Celo Alfajores ──────────────────
  const VRF_COORDINATOR = "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE"; 
  // 👆 get exact address from: https://docs.chain.link/vrf/v2-5/supported-networks#celo-alfajores
  
  const KEY_HASH = "0x807896f63ee63beba367158f3f09d07229f8f24db9e8f36aaabca28f82ba9f9e90";       
  // 👆 same page — the 500 gwei gas lane key hash  


  const SUBSCRIPTION_ID = 0n;    


  // ── Deploy ────────────────────────────────────────────────
  const LootScratch = await ethers.getContractFactory("LootScratch");
  
  const contract = await LootScratch.deploy(
    VRF_COORDINATOR,
    KEY_HASH,
    SUBSCRIPTION_ID,
  );

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ LootScratch deployed to:", address);
  console.log("📋 Add this to constants/contracts.ts");
  console.log("🔗 Add as VRF consumer at: https://vrf.chain.link");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
