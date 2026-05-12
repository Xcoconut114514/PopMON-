import React, { useEffect, useState } from 'react'
import { formatEther } from 'viem'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { CONTRACTS, monadTestnet, RARITY_BORDER } from '../config'
import { GACHA_POOL_ABI, GACHA_CARD_ABI } from '../abis'
import { RarityBadge } from '../components/RarityBadge'
import { useLang } from '../i18n'

interface OwnedCard {
  tokenId: bigint
  cardId: bigint
  poolId: bigint
  name: string
  rarity: number
  rarityName: string
  buybackPriceWei: bigint
  tokenURIBase: string
}

interface Props {
  onBack: () => void
}

export const CollectionPage: React.FC<Props> = ({ onBack }) => {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: monadTestnet.id })
  const { writeContractAsync } = useWriteContract()
  const { t } = useLang()

  const [cards, setCards] = useState<OwnedCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sellingId, setSellingId] = useState<bigint | null>(null)

  // ── Load user's tokens ────────────────────────────────────────────────────
  useEffect(() => {
    if (!address || !client) return

    const load = async () => {
      setIsLoading(true)
      try {
        const totalMinted = await client.readContract({
          address: CONTRACTS.gachaCard,
          abi: GACHA_CARD_ABI,
          functionName: 'totalMinted',
        }) as bigint

        const owned: OwnedCard[] = []

        // Check each token (since tokenIds are sequential from 1)
        // For scalability this should use Transfer events, but for testnet < 1000 tokens it's fine
        const checks: Promise<void>[] = []
        for (let tokenId = 1n; tokenId <= totalMinted; tokenId++) {
          const tid = tokenId
          checks.push(
            (async () => {
              try {
                const owner = await client.readContract({
                  address: CONTRACTS.gachaCard,
                  abi: GACHA_CARD_ABI,
                  functionName: 'ownerOf',
                  args: [tid],
                }) as `0x${string}`

                if (owner.toLowerCase() === address.toLowerCase()) {
                  const [cardId, poolId, card] = await Promise.all([
                    client.readContract({
                      address: CONTRACTS.gachaCard,
                      abi: GACHA_CARD_ABI,
                      functionName: 'tokenCardId',
                      args: [tid],
                    }) as Promise<bigint>,
                    client.readContract({
                      address: CONTRACTS.gachaCard,
                      abi: GACHA_CARD_ABI,
                      functionName: 'tokenPoolId',
                      args: [tid],
                    }) as Promise<bigint>,
                    client.readContract({
                      address: CONTRACTS.gachaPool,
                      abi: GACHA_POOL_ABI,
                      functionName: 'getCardByToken',
                      args: [tid],
                    }),
                  ])
                  const c = card as any
                  owned.push({
                    tokenId: tid,
                    cardId,
                    poolId,
                    name: c.name,
                    rarity: c.rarity,
                    rarityName: c.rarityName,
                    buybackPriceWei: c.buybackPriceWei,
                    tokenURIBase: c.tokenURIBase,
                  })
                }
              } catch (_) {
                // token may be burned
              }
            })()
          )
        }

        await Promise.all(checks)
        owned.sort((a, b) => Number(b.rarity) - Number(a.rarity))
        setCards(owned)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [address, client])

  // ── Sell card ─────────────────────────────────────────────────────────────
  const handleSell = async (tokenId: bigint) => {
    setSellingId(tokenId)
    try {
      await writeContractAsync({
        address: CONTRACTS.gachaPool,
        abi: GACHA_POOL_ABI,
        functionName: 'sellCard',
        args: [tokenId],
      })
      setCards((prev) => prev.filter((c) => c.tokenId !== tokenId))
      alert(t.selling + ' OK')
    } catch (e: any) {
      alert(e.shortMessage ?? t.sell + ' failed')
    } finally {
      setSellingId(null)
    }
  }

  // ── Top 3 by rarity ───────────────────────────────────────────────────────
  const bestPulls = cards.slice(0, 3)

  return (
    <div className="min-h-screen bg-monad-bg bg-grid-pattern font-pixel">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-4 border-gray-800 bg-black/60">
        <button
          onClick={onBack}
          className="text-[8px] text-gray-400 hover:text-white border-2 border-gray-600 hover:border-white px-3 py-2 transition-colors"
        >
          {t.back}
        </button>
        <h1 className="text-[10px] text-monad-purple">{t.myCollection}</h1>
        <div className="w-20" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!address && (
          <p className="text-[8px] text-gray-400 text-center py-16 animate-blink">
            {t.noWallet}
          </p>
        )}

        {address && isLoading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-4 border-monad-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-[8px] text-gray-400 animate-blink">{t.loading}</p>
          </div>
        )}

        {address && !isLoading && cards.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">💭</p>
            <p className="text-[8px] text-gray-400">{t.noCards}</p>
          </div>
        )}

        {/* Best Pulls */}
        {bestPulls.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-400">🏆</span>
              <h2 className="text-[9px] text-yellow-400">{t.myBestPulls}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {bestPulls.map((card) => (
                <div
                  key={card.tokenId}
                  className={`bg-gray-900 border-4 p-4 ${RARITY_BORDER[card.rarity] ?? 'rarity-common'}`}
                >
                  <img
                    src={card.tokenURIBase}
                    alt={card.name}
                    className="w-full h-32 object-contain pixelated mb-3"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src =
                        `https://placehold.co/200x128/0f0e17/836EF9?text=${encodeURIComponent(card.name)}`
                    }}
                  />
                  <RarityBadge rarity={card.rarity} className="mb-2" />
                  <p className="text-[8px] text-white mb-1">{card.name}</p>
                  <p className="text-[7px] text-gray-500">#{card.tokenId.toString()}</p>
                  <p className="text-[7px] text-green-400 mt-1">
                    {t.buyback}: {formatEther(card.buybackPriceWei)} MON
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Cards */}
        {cards.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-monad-purple">🃏</span>
              <h2 className="text-[9px] text-monad-purple">{t.allMyPulls}</h2>
              <span className="text-[7px] text-gray-500">({cards.length} {t.cards})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cards.map((card) => {
                const isSelling = sellingId === card.tokenId
                return (
                  <div
                    key={card.tokenId}
                    className={`bg-gray-900 border-2 p-3 flex flex-col gap-2 hover:border-monad-purple transition-colors ${RARITY_BORDER[card.rarity] ?? 'rarity-common'}`}
                  >
                    <img
                      src={card.tokenURIBase}
                      alt={card.name}
                      className="w-full h-24 object-contain pixelated"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          `https://placehold.co/160x96/0f0e17/836EF9?text=${encodeURIComponent(card.name)}`
                      }}
                    />
                    <RarityBadge rarity={card.rarity} className="text-[6px]" />
                    <p className="text-[7px] text-white leading-4">{card.name}</p>
                    <p className="text-[6px] text-gray-500">#{card.tokenId.toString()}</p>
                    <button
                      onClick={() => handleSell(card.tokenId)}
                      disabled={isSelling}
                      className="mt-auto py-2 border-2 border-green-600 text-green-400 text-[6px] hover:bg-green-600 hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSelling ? t.selling : `${t.sell} ${formatEther(card.buybackPriceWei)} MON`}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
