import React from 'react'
import { formatEther } from 'viem'
import { useReadContract } from 'wagmi'
import { CONTRACTS } from '../config'
import { GACHA_POOL_ABI } from '../abis'
import { RarityBadge } from './RarityBadge'

interface Props {
  poolId: bigint
  onClose: () => void
}

export const PoolInfoModal: React.FC<Props> = ({ poolId, onClose }) => {
  const { data: cards, isLoading } = useReadContract({
    address: CONTRACTS.gachaPool,
    abi: GACHA_POOL_ABI,
    functionName: 'getPoolCards',
    args: [poolId],
  })

  const { data: info } = useReadContract({
    address: CONTRACTS.gachaPool,
    abi: GACHA_POOL_ABI,
    functionName: 'getPoolInfo',
    args: [poolId],
  })

  const totalWeight = cards?.reduce((acc, c) => acc + Number(c.weight), 0) ?? 10000

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border-4 border-monad-purple shadow-neon-purple max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-monad-dark border-b-4 border-monad-purple">
          <div>
            <h2 className="text-[10px] text-monad-purple font-pixel">OPEN SOURCE CARD POOL</h2>
            <p className="text-xs text-white mt-1">{info?.name ?? '...'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm border-2 border-gray-600 px-3 py-1 hover:border-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contract link */}
        <div className="px-6 py-3 bg-gray-800 border-b-2 border-gray-700 flex items-center gap-3 flex-wrap">
          <span className="text-[8px] text-gray-400">CONTRACT:</span>
          <a
            href={`https://testnet.monadexplorer.com/address/${CONTRACTS.gachaPool}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[8px] text-monad-ice underline break-all"
          >
            {CONTRACTS.gachaPool}
          </a>
          <span className="text-[8px] text-green-400">✓ VERIFIED OPEN SOURCE</span>
        </div>

        {/* Info row */}
        <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b-2 border-gray-700">
          <div>
            <p className="text-[8px] text-gray-400">PACK PRICE</p>
            <p className="text-sm text-monad-purple mt-1">
              {info ? formatEther(info.priceWei) : '—'} MON
            </p>
          </div>
          <div>
            <p className="text-[8px] text-gray-400">RANDOM METHOD</p>
            <p className="text-[8px] text-white mt-1">keccak256(prevrandao+nonce)</p>
          </div>
        </div>

        {/* Cards table */}
        <div className="px-6 py-4">
          <p className="text-[8px] text-monad-ice mb-3">CARD POOL — ALL WEIGHTS ARE ON-CHAIN</p>
          {isLoading ? (
            <p className="text-[8px] text-gray-400 animate-blink">LOADING...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b-2 border-gray-700">
                    <th className="text-left py-2 text-gray-400">CARD</th>
                    <th className="text-center py-2 text-gray-400">RARITY</th>
                    <th className="text-right py-2 text-gray-400">RATE</th>
                    <th className="text-right py-2 text-gray-400">BUYBACK</th>
                  </tr>
                </thead>
                <tbody>
                  {cards?.map((card) => {
                    const rate = ((Number(card.weight) / totalWeight) * 100).toFixed(1)
                    return (
                      <tr key={card.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 text-white">{card.name}</td>
                        <td className="py-3 text-center">
                          <RarityBadge rarity={card.rarity} />
                        </td>
                        <td className="py-3 text-right text-monad-purple">{rate}%</td>
                        <td className="py-3 text-right text-green-400">
                          {formatEther(card.buybackPriceWei)} MON
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t-2 border-gray-700">
          <p className="text-[7px] text-gray-500 leading-5">
            ⚠ All rates are enforced on-chain. The smart contract source is publicly verifiable on Monad Explorer.
            Randomness uses block.prevrandao — suitable for testnet. Upgrade to VRF for mainnet.
          </p>
        </div>
      </div>
    </div>
  )
}
