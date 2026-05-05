import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/** Deploy with e.g.
 * VRF_COORDINATOR=0x... KEY_HASH=0x... SUBSCRIPTION_ID=... \
 *   pnpm exec hardhat ignition deploy ignition/modules/LootScratch.ts --network base-sepolia
 */
export default buildModule("LootScratchModule", (m) => {
  const vrfCoordinator = m.getParameter(
    "vrfCoordinator",
    process.env.VRF_COORDINATOR ?? "0x5C21eF41CD1a72de73bF76eC39637bB0d3d7BEE"
  );
  const keyHash = m.getParameter(
    "keyHash",
    (process.env.VRF_KEY_HASH ??
      "0x807896f63ee63beba367158f3f09d07229f8f24db9e8f36aaabca28f82ba9f9e9") as `0x${string}`
  );
  const subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID ?? "1");

  const loot = m.contract("LootScratch", [vrfCoordinator, keyHash, subscriptionId]);

  return { loot };
});
