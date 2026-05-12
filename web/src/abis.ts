// Auto-extracted from compiled artifacts
export const GACHA_POOL_ABI = [
  // ── Write ──────────────────────────────────────────────────────────────────
  {
    name: 'buyPack',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
  {
    name: 'sellCard',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  // ── Read ───────────────────────────────────────────────────────────────────
  {
    name: 'getAllPools',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'pools',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'priceWei', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'cardCount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getPoolInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      {
        name: 'info',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'priceWei', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'cardCount', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'getPoolCards',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'poolId', type: 'uint256' }],
    outputs: [
      {
        name: 'cards',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'rarity', type: 'uint8' },
          { name: 'rarityName', type: 'string' },
          { name: 'weight', type: 'uint256' },
          { name: 'buybackPriceWei', type: 'uint256' },
          { name: 'tokenURIBase', type: 'string' },
        ],
      },
    ],
  },
  {
    name: 'getCardByToken',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        name: 'card',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'rarity', type: 'uint8' },
          { name: 'rarityName', type: 'string' },
          { name: 'weight', type: 'uint256' },
          { name: 'buybackPriceWei', type: 'uint256' },
          { name: 'tokenURIBase', type: 'string' },
        ],
      },
    ],
  },
  {
    name: 'getReserveBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    name: 'PullResult',
    type: 'event',
    inputs: [
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'poolId', type: 'uint256', indexed: true },
      { name: 'cardId', type: 'uint256', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: false },
      { name: 'rarity', type: 'uint8', indexed: false },
      { name: 'cardName', type: 'string', indexed: false },
    ],
  },
  {
    name: 'CardSold',
    type: 'event',
    inputs: [
      { name: 'seller', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'cardId', type: 'uint256', indexed: true },
      { name: 'buybackPriceWei', type: 'uint256', indexed: false },
    ],
  },
] as const

export const GACHA_CARD_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'tokenCardId',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenPoolId',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalMinted',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  // Transfer event — used to enumerate user tokens
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
] as const
