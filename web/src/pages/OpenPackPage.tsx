import React, { useState, useCallback } from 'react'
import { formatEther, parseEther } from 'viem'
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { CONTRACTS, monadTestnet } from '../config'
import { GACHA_POOL_ABI } from '../abis'
import { ScratchReveal } from '../components/ScratchReveal'
import { CardRevealModal } from '../components/CardRevealModal'
import { RarityBadge } from '../components/RarityBadge'
import { useLang } from '../i18n'

type Phase = 'select' | 'buying' | 'scratch' | 'reveal' | 'selling'

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
  poolId: bigint
  onBack: () => void
}

export const OpenPackPage: React.FC<Props> = ({ poolId, onBack }) => {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: monadTestnet.id })
  const { t } = useLang()

  const [phase, setPhase] = useState<Phase>('select')
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()
  const [mintedTokenId, setMintedTokenId] = useState<bigint | null>(null)
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [error, setError] = useState('')
  const [isSelling, setIsSelling] = useState(false)

  // ── Contract reads ──────────────────────────────────────────────────────────
  const { data: poolInfo } = useReadContract({
    address: CONTRACTS.gachaPool,
    abi: GACHA_POOL_ABI,
    functionName: 'getPoolInfo',
    args: [poolId],
  })

  // ── Contract writes ─────────────────────────────────────────────────────────
  const { writeContractAsync } = useWriteContract()

  // Wait for buyPack tx
  const { data: txReceipt } = useWaitForTransactionReceipt({ hash: txHash })

  // ── Buy pack ────────────────────────────────────────────────────────────────
  const handleBuy = useCallback(async () => {
    if (!address || !poolInfo) return
    setError('')
    setPhase('buying')
    try {
      const hash = await writeContractAsync({
        address: CONTRACTS.gachaPool,
        abi: GACHA_POOL_ABI,
        functionName: 'buyPack',
        args: [poolId],
        value: poolInfo.priceWei,
      })
      setTxHash(hash)
      setPhase('scratch')

      // Wait for receipt + parse PullResult event
      if (client) {
        const receipt = await client.waitForTransactionReceipt({ hash })
        // Parse PullResult log
        for (const log of receipt.logs) {
          try {
            // PullResult topic0 = keccak256("PullResult(address,uint256,uint256,uint256,uint8,string)")
            const pullResultSig = '0x' + 'PullResult(address,uint256,uint256,uint256,uint8,string)'
            // Decode via viem's decodeEventLog
            const { decodeEventLog } = await import('viem')
            const decoded = decodeEventLog({
              abi: GACHA_POOL_ABI,
              data: log.data,
              topics: log.topics,
              eventName: 'PullResult',
            })
            const { tokenId } = decoded.args as any
            setMintedTokenId(tokenId)

            // Fetch full card data
            const card = await client.readContract({
              address: CONTRACTS.gachaPool,
              abi: GACHA_POOL_ABI,
              functionName: 'getCardByToken',
              args: [tokenId],
            })
            setCardData(card as CardData)
            break
          } catch (_) {
            // not a PullResult log, skip
          }
        }
      }
    } catch (e: any) {
      setError(e.shortMessage ?? e.message ?? 'Transaction failed')
      setPhase('select')
    }
  }, [address, poolInfo, poolId, writeContractAsync, client])

  // ── Scratch complete → show card ───────────────────────────────────────────
  const handleScratchDone = useCallback(() => {
    if (cardData) setPhase('reveal')
  }, [cardData])

  // ── Sell card ───────────────────────────────────────────────────────────────
  const handleSell = useCallback(async () => {
    if (!mintedTokenId) return
    setIsSelling(true)
    try {
      await writeContractAsync({
        address: CONTRACTS.gachaPool,
        abi: GACHA_POOL_ABI,
        functionName: 'sellCard',
        args: [mintedTokenId],
      })
      alert('Card sold! MON has been returned to your wallet.')
      onBack()
    } catch (e: any) {
      alert(e.shortMessage ?? 'Sell failed')
    } finally {
      setIsSelling(false)
    }
  }, [mintedTokenId, writeContractAsync, onBack])

  // ── Reset for another pull ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPhase('select')
    setTxHash(undefined)
    setMintedTokenId(null)
    setCardData(null)
    setError('')
  }, [])

  // ══════════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════════

  if (phase === 'reveal' && cardData && mintedTokenId !== null) {
    return (
      <CardRevealModal
        tokenId={mintedTokenId}
        card={cardData}
        onPullAnother={handleReset}
        onSell={handleSell}
        isSelling={isSelling}
      />
    )
  }

  return (
    <div className="min-h-screen bg-monad-bg bg-grid-pattern flex flex-col items-center font-pixel">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 py-4 border-b-4 border-gray-800 bg-black/60">
        <button
          onClick={onBack}
          className="text-[8px] text-gray-400 hover:text-white border-2 border-gray-600 hover:border-white px-3 py-2 transition-colors"
        >
          {t.back}
        </button>
        <h1 className="text-[10px] text-monad-purple">{t.openPackTitle}</h1>
        <div className="w-20" />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-4 py-12 gap-8">

        {/* Pool info card */}
        {poolInfo && (
          <div className="bg-gray-900 border-4 border-gray-700 px-8 py-4 text-center">
            <p className="text-[8px] text-gray-400">{t.currentPool}</p>
            <p className="text-sm text-white mt-1">{poolInfo.name}</p>
            <p className="text-[8px] text-monad-purple mt-2">
              {t.price}: {formatEther(poolInfo.priceWei)} MON
            </p>
          </div>
        )}

        {/* Phase: Select */}
        {phase === 'select' && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-48 h-48 border-4 border-monad-purple bg-monad-dark flex items-center justify-center animate-float shadow-neon-purple relative">
              <span className="text-6xl">📦</span>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-monad-purple animate-pulse" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-yellow-400 animate-blink" />
            </div>

            {error && (
              <div className="bg-red-900/50 border-2 border-red-500 px-4 py-3 text-[8px] text-red-300 max-w-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={!address}
              className="px-10 py-5 bg-monad-purple border-4 border-black text-white font-pixel text-[10px] font-bold shadow-pixel hover:bg-[#9481FA] transition-colors active:shadow-pixel-active active:translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!address ? t.connectWallet : `${t.insert} ${poolInfo ? formatEther(poolInfo.priceWei) : '?'} MON`}
            </button>

            <p className="text-[7px] text-gray-500 text-center max-w-xs leading-6">
              {t.clickToPay}
            </p>
          </div>
        )}

        {/* Phase: Buying */}
        {phase === 'buying' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-monad-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-[8px] text-monad-purple animate-blink">{t.confirming}</p>
            <p className="text-[7px] text-gray-500">{t.approveWallet}</p>
          </div>
        )}

        {/* Phase: Scratch */}
        {phase === 'scratch' && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-[9px] text-monad-ice text-center">{t.scratchReveal}</p>
            <ScratchReveal
              onComplete={handleScratchDone}
              isReady={cardData !== null}
            />
            {txHash && (
              <a
                href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[7px] text-gray-500 underline"
              >
                VIEW TX ON EXPLORER ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
