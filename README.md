# MON GACHA — Monad NFT Gacha Machine

A pixel-art NFT gacha DApp on Monad Testnet. Buy packs, scratch to reveal cards, collect and sell NFTs on-chain.

## Contracts (Monad Testnet, ChainID: 10143)

| Contract | Address |
|----------|---------|
| GachaCard (ERC-721) | `0x74F38dc604A8AF5737bb0685F7c73FD595ff8b36` |
| GachaPool | `0x806fab8230f8f52F247fDeCA08Ac7F1F2A3380bF` |

## Card Pools

### Pokemon Pack (1 MON)
| Card | Rarity | Rate | Buyback |
|------|--------|------|---------|
| Charizard | Legendary | 1% | 0.5 MON |
| Pikachu EX | Epic | 4% | 0.2 MON |
| Gengar | Rare | 10% | 0.05 MON |
| Eevee | Uncommon | 25% | 0.02 MON |
| Bulbasaur | Common | 60% | 0.005 MON |

### Monad Genesis Pack (0.5 MON)
| Card | Rarity | Rate | Buyback |
|------|--------|------|---------|
| Monad Genesis | Legendary | 1% | 0.25 MON |
| Monad Validator | Epic | 4% | 0.1 MON |
| Monad Purple | Rare | 10% | 0.025 MON |
| Monad Ice | Uncommon | 25% | 0.01 MON |
| Monad Common | Common | 60% | 0.0025 MON |

## Quick Start

### Frontend
```bash
cd web
npm install
npm run dev
```

### Contracts (redeploy)
```bash
cd contracts
npm install
# add PRIVATE_KEY to .env
npm run deploy
```

## Tech Stack
- Frontend: React + Vite + Wagmi v2 + RainbowKit + Tailwind CSS v3
- Contracts: Solidity 0.8.26 + Hardhat + OpenZeppelin v5
- Chain: Monad Testnet (ChainID: 10143)
