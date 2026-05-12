import React, { useState, useCallback, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { useReadContract, useWriteContract, useAccount, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { CONTRACTS, monadTestnet } from '../config'
import { GACHA_POOL_ABI } from '../abis'
import { ScratchReveal } from '../components/ScratchReveal'
import { CardRevealModal } from '../components/CardRevealModal'
import { RarityBadge } from '../components/RarityBadge'
import { useLang } from '../i18n'

type Phase = 'select' | 'buying' | 'scratch' | 'video' | 'reveal' | 'selling'

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
  const [scratchDone, setScratchDone] = useState(false)

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

  // ── Scratch complete → play video → show card ─────────────────────────────
  const handleScratchDone = useCallback(() => {
    if (cardData) setPhase('video')
    else setScratchDone(true)
  }, [cardData])

  // If scratch finished before tx confirmed, auto-reveal once cardData arrives
  useEffect(() => {
    if (scratchDone && cardData) setPhase('video')
  }, [scratchDone, cardData])

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
      onBack()
    } catch (e: any) {
      setError(e.shortMessage ?? 'Sell failed')
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
    setScratchDone(false)
  }, [])

  // ══════════════════════════════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════════════════════════════

  if (phase === 'video') {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <video
          src="/openCard.mp4"
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          onEnded={() => setPhase('reveal')}
        />
      </div>
    )
  }

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
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            {/* Pack visual card */}
            <div className="relative w-full">
              {/* Atmosphere glow */}
              <div className="absolute inset-0 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, #836EF9 0%, transparent 70%)' }} />

              <div className="relative border-2 border-monad-purple bg-gradient-to-b from-[#1a0f3a] to-monad-dark p-8 flex flex-col items-center gap-4"
                style={{ boxShadow: '0 0 40px rgba(131,110,249,0.35), inset 0 0 30px rgba(131,110,249,0.08)' }}>

                {/* Pack icon */}
                <div className="relative">
                  <div className="absolute inset-0 blur-xl" style={{ background: 'radial-gradient(circle, #836EF9, transparent)' }} />
                  <div className="relative w-28 h-28 border-2 border-monad-purple flex items-center justify-center"
                    style={{ animation: 'float 3s ease-in-out infinite', background: 'linear-gradient(135deg, #2d1b5e, #1a0f3a)' }}>
                    <span className="text-6xl select-none">{poolInfo?.name?.toLowerCase().includes('mon') ? '💫' : '🎴'}</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-monad-purple" style={{ animation: 'blink 1s step-end infinite' }} />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-yellow-400" style={{ animation: 'blink 1.5s step-end infinite' }} />
                  </div>
                </div>

                {/* Price display */}
                {poolInfo && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white" style={{ textShadow: '0 0 20px rgba(131,110,249,0.8)' }}>
                      {formatEther(poolInfo.priceWei)}
                      <span className="text-monad-purple ml-2">MON</span>
                    </p>
                  </div>
                )}

                {/* Monad speed badge */}
                <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/40 px-4 py-2">
                  <span className="text-yellow-400 text-base">⚡</span>
                  <span className="text-[7px] text-yellow-300 font-pixel">MONAD ≈ 1 SEC CONFIRMATION</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border-2 border-red-500 px-4 py-3 text-[8px] text-red-300 w-full text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={!address}
              className="w-full py-5 font-pixel text-[10px] font-bold text-white transition-all active:translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: address
                  ? 'linear-gradient(135deg, #836EF9, #6B52D9)'
                  : '#4a4a4a',
                boxShadow: address ? '0 0 24px rgba(131,110,249,0.6), 0 4px 0 #4a2db0' : 'none',
              }}
            >
              {!address
                ? t.connectWallet
                : `🪙 ${t.insert} ${poolInfo ? formatEther(poolInfo.priceWei) : '?'} MON`}
            </button>

            <p className="text-[7px] text-gray-600 text-center max-w-xs leading-5">
              {t.clickToPay}
            </p>
          </div>
        )}

        {/* Phase: Buying */}
        {phase === 'buying' && (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            <div className="border-2 border-monad-purple p-8 flex flex-col items-center gap-5 w-full"
              style={{ background: 'linear-gradient(to bottom, #1a0f3a, #0f0e17)' }}>
              {/* Monad speed visualizer */}
              <div className="text-center">
                <p className="text-[8px] text-monad-purple font-pixel" style={{ animation: 'blink 0.8s step-end infinite' }}>MONAD PROCESSING...</p>
                <p className="text-[7px] text-yellow-400 font-pixel mt-1">⚡ HIGH PERFORMANCE BLOCKCHAIN</p>
              </div>
              {/* Animated bars */}
              <div className="flex items-end gap-1 h-12">
                {[0.6, 1, 0.75, 0.9, 0.5, 0.8, 0.65].map((h, i) => (
                  <div
                    key={i}
                    className="w-3 rounded-sm"
                    style={{
                      height: `${h * 100}%`,
                      background: 'linear-gradient(to top, #836EF9, #A0C2F9)',
                      animation: `barPulse ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  />
                ))}
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-monad-purple border-t-yellow-400 animate-spin" />
              <p className="text-[8px] text-gray-400 font-pixel">{t.approveWallet}</p>
            </div>
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
