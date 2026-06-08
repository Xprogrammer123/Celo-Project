import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LootScratchModule", (m) => {
  const loot = m.contract("LootScratch", []);

  return { loot };
});
