import React from 'react'
import { formatEther } from 'viem'
import { RarityBadge } from './RarityBadge'
import { RARITY_BORDER } from '../config'
import { useLang } from '../i18n'

interface CardData {
  id: bigint
  name: string
  rarity: number
  rarityName: string
  weight: bigint
  buybackPriceWei: bigint
  tokenURIBase: string
}

interface Props {
  tokenId: bigint
  card: CardData
  onPullAnother: () => void
  onSell: () => void
  isSelling: boolean
}

const RARITY_FALLBACK = [
  '/silver.jpg',   // 0 Common
  '/silver.jpg',   // 1 Uncommon
  '/gold.jpg',     // 2 Rare
  '/gold.jpg',     // 3 Epic
  '/diamond.jpg',  // 4 Legendary
]

const RARITY_GLOWS = [
  '',
  'drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]',
  'drop-shadow-[0_0_10px_rgba(96,165,250,0.7)]',
  'drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]',
  'drop-shadow-[0_0_20px_rgba(245,158,11,1)]',
]

export const CardRevealModal: React.FC<Props> = ({
  tokenId,
  card,
  onPullAnother,
  onSell,
  isSelling,
}) => {
  const borderClass = RARITY_BORDER[card.rarity] ?? 'rarity-common'
  const glowClass = RARITY_GLOWS[card.rarity] ?? ''
  const isLegendary = card.rarity === 4
  const { t } = useLang()

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
      {/* Legendary confetti bg */}
      {isLegendary && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ['#f59e0b', '#836EF9', '#A0C2F9', '#fff'][i % 4],
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>
      )}

      {/* Card */}
      <div className={`relative animate-float border-4 ${borderClass} ${glowClass} bg-gray-900 p-2 mb-8`}
        style={{ width: 240, maxWidth: '90vw' }}>
        {/* PSA-style label */}
        <div className="bg-red-700 px-2 py-1 mb-2 flex items-center justify-between">
          <span className="text-[6px] text-white">{t.psaLabel}</span>
          <span className="text-[6px] text-yellow-300">#{tokenId.toString()}</span>
        </div>

        {/* Card image */}
        <div className="relative bg-gray-800 overflow-hidden" style={{ height: 200 }}>
          <img
            src={RARITY_FALLBACK[card.rarity] ?? '/silver.jpg'}
            alt={card.name}
            className={`w-full h-full object-contain pixelated ${glowClass}`}
          />
          {isLegendary && (
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Card footer */}
        <div className="mt-2 px-1">
          <p className="text-[8px] text-white truncate">{card.name}</p>
          <div className="flex items-center justify-between mt-1">
            <RarityBadge rarity={card.rarity} />
            <span className="text-[7px] text-gray-400">
              {((Number(card.weight) / 10000) * 100).toFixed(1)}% {t.rateLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={onPullAnother}
          className="px-6 py-4 border-4 border-gray-600 text-gray-300 font-pixel text-[9px] hover:border-white hover:text-white transition-colors shadow-pixel"
        >
          {t.pullAnother}
        </button>
        <button
          onClick={onSell}
          disabled={isSelling}
          className="px-6 py-4 border-4 border-black bg-yellow-500 text-black font-pixel text-[9px] font-bold shadow-pixel hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSelling ? t.selling : `${t.sellFor} ${formatEther(card.buybackPriceWei)} MON`}
        </button>
      </div>

      <p className="mt-4 text-[7px] text-gray-600">Token ID #{tokenId.toString()}</p>
    </div>
  )
}
