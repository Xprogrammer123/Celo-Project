import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28", // using 0.8.28 instead of 0.8.24 to match your existing config and avoid errors
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun",
    },
  },
  networks: {
    alfajores: {
      url: process.env.CELO_ALFAJORES_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org/",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 11142220,
    },
    celo: {
      url: process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org",
      accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : [],
      chainId: 42220,
    },
  },
};

export default config;
