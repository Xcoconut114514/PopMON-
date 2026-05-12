import React from 'react'
import { RARITY_BG, RARITY_NAMES } from '../config'

interface Props {
  rarity: number
  className?: string
}

export const RarityBadge: React.FC<Props> = ({ rarity, className = '' }) => {
  const bg = RARITY_BG[rarity] ?? 'bg-gray-600'
  const name = RARITY_NAMES[rarity] ?? 'Unknown'
  return (
    <span
      className={`inline-block px-2 py-1 text-[8px] font-pixel font-bold text-white uppercase border-2 border-black shadow-pixel-sm ${bg} ${className}`}
    >
      {name}
    </span>
  )
}
