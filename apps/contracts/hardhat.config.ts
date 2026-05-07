import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    alfajores: {
      url:
        process.env.CELO_ALFAJORES_RPC_URL ||
        "https://alfajores-forno.celo-testnet.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 44787, // ✅ fixed
    },
    celo: {
      url:
        process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 42220,
    },
  },
};

export default config;