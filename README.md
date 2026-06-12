# ROVA Memory

Memory game on Celo — match hidden NFT tiles, win 3 rounds in a row, mint a **Loot Scratch** NFT on-chain.

Built with Next.js, Wagmi, RainbowKit, and Hardhat (Turborepo monorepo).

## How it works

1. **Play** — 4×3 board, 2 hidden NFT prize cards, **3 trials** per round (2 picks each).
2. **Pay with ROVA** — in-game credits bought with CELO (or free demo mode).
3. **Win streak** — win **3 rounds in a row** without a loss → wallet prompts an on-chain mint (~0.001 CELO fee).
4. **NFT** — ERC-721 `LOOT` token with on-chain SVG art (Common → Legendary).

### ROVA economy

| | |
|---|---|
| **100 ROVA pack** | 0.3 CELO |
| **50 ROVA pack** | 0.15 CELO |
| **20 ROVA pack** | 0.06 CELO |
| **1 game** | 2 ROVA |
| **Games per 100 ROVA** | 50 |

Pack prices live in `apps/web/src/constants/rova.ts`.

## Quick start (Celo Sepolia — faucet testing)

### 1. Install

```bash
pnpm install
```

### 2. Environment

```bash
cp apps/web/.env.sepolia.example apps/web/.env.local
```

Edit `apps/contracts/.env` — set `PRIVATE_KEY` (wallet with [faucet CELO](https://faucet.celo.org/celo-sepolia), no `0x` prefix).

### 3. Deploy contract

```bash
pnpm contracts:deploy:celo-sepolia
```

Copy the printed address into `apps/web/.env.local`:

```
NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS=0xYourDeployedAddress
```

### 4. Run the app

```bash
pnpm dev:sepolia
```

Open [http://localhost:3000/play](http://localhost:3000/play).

- Connect wallet on **Celo Sepolia** (chain ID `11142220`).
- Yellow **TESTNET MODE** banner confirms Sepolia is active.
- Tap a ROVA pack → confirm CELO in wallet → play.

### Mainnet

Use `pnpm dev` (default network is Celo mainnet — see `apps/web/src/constants/chains.mainnet.ts`). Deploy with `pnpm contracts:deploy:celo` and set env vars accordingly.

## Network switch

Controlled by `NEXT_PUBLIC_CELO_NETWORK` in `.env.local`:

| Value | Network | Config file |
|-------|---------|-------------|
| `sepolia` | Celo Sepolia (faucet) | `chains.sepolia.ts` |
| `mainnet` or unset | Celo mainnet | `chains.mainnet.ts` |

Or run `pnpm dev:sepolia` to force testnet without editing the file.

## Project structure

```
apps/web/          Next.js frontend (game, wallet, gallery)
apps/contracts/    LootScratch.sol + Hardhat deploy scripts
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (mainnet config) |
| `pnpm dev:sepolia` | Dev server on Celo Sepolia |
| `pnpm build` | Production build |
| `pnpm contracts:compile` | Compile contracts |
| `pnpm contracts:test` | Run contract tests |
| `pnpm contracts:deploy:celo-sepolia` | Deploy to Sepolia (~30s, no prompt) |
| `pnpm contracts:deploy:celo` | Deploy to Celo mainnet |

## Env vars (web)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CELO_NETWORK` | `sepolia` or `mainnet` |
| `CELO_RPC_URL` | RPC endpoint |
| `NEXT_PUBLIC_LOOT_SCRATCH_ADDRESS` | Deployed `LootScratch` contract |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID (optional) |

## Tech stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, RainbowKit, Wagmi, Viem
- **Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin ERC-721
- **Chain**: [Celo](https://docs.celo.org/) / [Celo Sepolia faucet](https://faucet.celo.org/celo-sepolia)

## Links

- [Celo docs](https://docs.celo.org/)
- [Sepolia explorer](https://sepolia.celoscan.io/)
