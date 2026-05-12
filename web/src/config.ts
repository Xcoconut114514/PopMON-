import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import { http } from 'wagmi'

// ── Monad Testnet chain definition ───────────────────────────────────────────
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'MonadExplorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
})

// ── Deployed contract addresses ───────────────────────────────────────────────
export const CONTRACTS = {
  gachaCard: '0x74F38dc604A8AF5737bb0685F7c73FD595ff8b36' as `0x${string}`,
  gachaPool: '0x806fab8230f8f52F247fDeCA08Ac7F1F2A3380bF' as `0x${string}`,
}

// ── Wagmi / RainbowKit config ─────────────────────────────────────────────────
export const wagmiConfig = getDefaultConfig({
  appName: 'MON GACHA',
  projectId: 'mongacha_demo_no_wc', // WalletConnect project ID (optional for local dev)
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
  ssr: false,
})

// ── Rarity helpers ────────────────────────────────────────────────────────────
export const RARITY_NAMES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const
export const RARITY_COLORS = [
  'text-rarity-common',
  'text-rarity-uncommon',
  'text-rarity-rare',
  'text-rarity-epic',
  'text-rarity-legendary',
] as const
export const RARITY_BORDER = [
  'rarity-common',
  'rarity-uncommon',
  'rarity-rare',
  'rarity-epic',
  'rarity-legendary',
] as const
export const RARITY_BG = [
  'bg-gray-600',
  'bg-green-700',
  'bg-blue-700',
  'bg-purple-700',
  'bg-yellow-600',
] as const
