import React, { createContext, useContext, useState } from 'react'

export type Lang = 'en' | 'zh'

const translations = {
  en: {
    // Header / brand
    brandName: 'PopMON',
    brandSub: 'MONAD TESTNET · CHAIN 10143',
    // HomePage hero
    hero: 'GACHA MACHINE',
    tagline: 'PAY MON · PULL CARDS · OWN YOUR NFT ON MONAD TESTNET',
    openSource: '◆ ALL RATES ARE ON-CHAIN & OPEN SOURCE ◆',
    livePulls: 'LIVE PULLS',
    reserve: 'RESERVE',
    // Pool card
    viewPoolInfo: 'VIEW POOL INFO',
    openPack: 'OPEN PACK',
    connectWallet: 'CONNECT WALLET',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    pricePerPull: 'PRICE PER PULL',
    cardTypes: 'card types',
    // Floating button
    myCards: 'MY CARDS 🃏',
    // OpenPackPage
    back: '← BACK',
    openPackTitle: 'OPEN PACK',
    currentPool: 'CURRENT POOL',
    price: 'PRICE',
    clickToPay: "Click to pay and open one pack. You'll scratch the card to reveal your NFT.",
    insert: 'INSERT',
    confirming: 'CONFIRMING TRANSACTION...',
    approveWallet: 'Please approve in your wallet',
    scratchReveal: 'Scratch to reveal your card!',
    cardReady: '✓ CARD MINTED! Scratch away...',
    // CollectionPage
    myCollection: 'MY COLLECTION',
    myBestPulls: 'MY BEST PULLS',
    allMyPulls: 'ALL MY PULLS',
    sell: 'SELL',
    selling: 'SELLING...',
    sellFor: 'SELL FOR',
    loading: 'LOADING YOUR CARDS...',
    noCards: 'NO CARDS YET. OPEN SOME PACKS!',
    noWallet: 'CONNECT WALLET TO VIEW YOUR COLLECTION',
    buyback: 'Buyback',
    cards: 'cards',
    // CardRevealModal
    pullAnother: 'PULL ANOTHER',
    psaLabel: 'PSA · POPMON TESTNET',
    rateLabel: 'rate',
    // PoolInfoModal
    poolInfoTitle: 'OPEN SOURCE CARD POOL',
    contract: 'CONTRACT',
    verified: '✓ VERIFIED OPEN SOURCE',
    packPrice: 'PACK PRICE',
    randomMethod: 'RANDOM METHOD',
    cardPool: 'CARD POOL — ALL WEIGHTS ARE ON-CHAIN',
    cardCol: 'CARD',
    rarityCol: 'RARITY',
    rateCol: 'RATE',
    buybackCol: 'BUYBACK',
    disclaimer:
      '⚠ All rates are enforced on-chain. The smart contract source is publicly verifiable on Monad Explorer. Randomness uses block.prevrandao — suitable for testnet. Upgrade to VRF for mainnet.',
    // LivePullsFeed
    noPulls: 'No recent pulls yet. Be the first!',
    from: 'from',
  },
  zh: {
    // Header / brand
    brandName: 'PopMON',
    brandSub: 'Monad 测试网 · 链ID 10143',
    // HomePage hero
    hero: '扭蛋机',
    tagline: '支付 MON · 抽卡 · 在 Monad 测试网拥有你的 NFT',
    openSource: '◆ 所有爆率均在链上公开可查 ◆',
    livePulls: '实时抽卡',
    reserve: '储备金',
    // Pool card
    viewPoolInfo: '查看卡池信息',
    openPack: '开启卡包',
    connectWallet: '连接钱包',
    active: '运营中',
    inactive: '已停用',
    pricePerPull: '单次价格',
    cardTypes: '种卡牌',
    // Floating button
    myCards: '我的卡牌 🃏',
    // OpenPackPage
    back: '← 返回',
    openPackTitle: '开启卡包',
    currentPool: '当前卡池',
    price: '价格',
    clickToPay: '点击支付并开启一个卡包，刮开卡片以揭晓你的 NFT。',
    insert: '投入',
    confirming: '交易确认中...',
    approveWallet: '请在钱包中确认交易',
    scratchReveal: '刮开卡片，揭晓你的卡牌！',
    cardReady: '✓ NFT 已铸造！开始刮卡...',
    // CollectionPage
    myCollection: '我的收藏',
    myBestPulls: '最佳抽卡',
    allMyPulls: '全部卡牌',
    sell: '出售',
    selling: '出售中...',
    sellFor: '出售获得',
    loading: '加载卡牌中...',
    noCards: '暂无卡牌，快去开包吧！',
    noWallet: '请连接钱包以查看你的收藏',
    buyback: '回购价',
    cards: '张',
    // CardRevealModal
    pullAnother: '再抽一次',
    psaLabel: 'PSA · 泡姆测试网',
    rateLabel: '爆率',
    // PoolInfoModal
    poolInfoTitle: '开源卡池信息',
    contract: '合约地址',
    verified: '✓ 已验证开源',
    packPrice: '卡包价格',
    randomMethod: '随机方式',
    cardPool: '卡池 — 所有权重均在链上',
    cardCol: '卡牌',
    rarityCol: '稀有度',
    rateCol: '爆率',
    buybackCol: '回购价',
    disclaimer:
      '⚠ 所有爆率由智能合约强制执行，合约代码在 Monad 浏览器上公开可查。随机性使用 block.prevrandao——适用于测试网，主网建议升级至 VRF。',
    // LivePullsFeed
    noPulls: '暂无最近抽卡记录，成为第一个！',
    from: '来自',
  },
}

export type T = typeof translations['en']

interface LangContextValue {
  lang: Lang
  t: T
  toggleLang: () => void
}

const LangContext = createContext<LangContextValue>({
  lang: 'zh',
  t: translations.zh,
  toggleLang: () => {},
})

export const LangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Lang>('zh')
  const toggleLang = () => setLang((l) => (l === 'en' ? 'zh' : 'en'))
  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
