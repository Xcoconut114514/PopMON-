import React, { useState, useRef, useEffect } from 'react'
import { formatEther } from 'viem'
import { useReadContract, useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { CONTRACTS } from '../config'
import { GACHA_POOL_ABI } from '../abis'
import { PoolInfoModal } from '../components/PoolInfoModal'
import { useLang } from '../i18n'

// Pool artwork configs (placeholder until real assets provided)
const POOL_ART = [
  {
    // Pokemon Pack
    bg: 'from-red-900 via-gray-900 to-yellow-900',
    border: 'border-yellow-500',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
    logo: '🎴',
    badge: 'POKEMON SERIES',
    badgeColor: 'bg-yellow-600',
    accent: 'text-yellow-400',
    ballImg: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
  },
  {
    // Monad Genesis Pack
    bg: 'from-monad-dark via-gray-900 to-purple-900',
    border: 'border-monad-purple',
    glow: 'shadow-neon-purple',
    logo: '⬡',
    badge: 'MONAD GENESIS',
    badgeColor: 'bg-monad-purple',
    accent: 'text-monad-purple',
    ballImg: null,
  },
]

interface Props {
  onSelectPool: (poolId: bigint) => void
}

export const HomePage: React.FC<Props> = ({ onSelectPool }) => {
  const { isConnected } = useAccount()
  const [infoPoolId, setInfoPoolId] = useState<bigint | null>(null)
  const { t, lang, toggleLang } = useLang()
  const [muted, setMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = 0.35
    a.play().catch(() => {/* autoplay blocked, user must interact first */})
  }, [])

  const toggleMute = () => {
    const a = audioRef.current
    if (!a) return
    if (muted) {
      a.muted = false
      a.play().catch(() => {})
      setMuted(false)
    } else {
      a.muted = true
      setMuted(true)
    }
  }

  const { data: pools } = useReadContract({
    address: CONTRACTS.gachaPool,
    abi: GACHA_POOL_ABI,
    functionName: 'getAllPools',
  })

  const { data: reserve } = useReadContract({
    address: CONTRACTS.gachaPool,
    abi: GACHA_POOL_ABI,
    functionName: 'getReserveBalance',
  })

  return (
    <div className="min-h-screen bg-monad-bg bg-grid-pattern flex flex-col font-pixel">
      {/* BGM */}
      <audio ref={audioRef} src="/bgm.mp3" loop muted />

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 border-b-4 border-gray-800 bg-black/60 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <img
            src="/logo.svg"
            alt="PopMON Logo"
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-sm text-white text-shadow-pixel leading-none flex items-baseline gap-2">
              <span>{t.brandName}</span>
              <span className="text-monad-purple">泡姆</span>
            </h1>
            <p className="text-[7px] text-monad-ice mt-1">{t.brandSub}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {reserve !== undefined && (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[7px] text-gray-500">{t.reserve}</span>
              <span className="text-[9px] text-yellow-400">{Number(formatEther(reserve)).toFixed(2)} MON</span>
            </div>
          )}
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="border-2 border-monad-purple text-monad-purple text-[8px] px-2 py-1 hover:bg-monad-purple hover:text-white transition-colors font-pixel"
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          {/* BGM toggle */}
          <button
            onClick={toggleMute}
            title={muted ? 'Unmute BGM' : 'Mute BGM'}
            className="border-2 border-gray-600 text-gray-400 text-[10px] px-2 py-1 hover:border-monad-purple hover:text-monad-purple transition-colors"
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="text-center pt-10 pb-4 px-4">
        {/* Main brand title */}
        <div className="inline-block relative mb-2">
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-monad-ice via-monad-purple to-yellow-400 drop-shadow-[4px_4px_0_rgba(0,0,0,1)] leading-tight">
            PopMON&nbsp;<span style={{ WebkitTextFillColor: '#F59E0B', fontSize: '1.15em' }}>泡姆</span>
          </h2>
          <div className="absolute -top-2 -right-4 w-4 h-4 bg-yellow-400 animate-blink" />
        </div>
        {/* Sub: GACHA MACHINE */}
        <p className="text-lg md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-monad-ice via-monad-purple to-yellow-400 drop-shadow-[3px_3px_0_rgba(0,0,0,1)] mb-4">
          {t.hero}
        </p>
        <p className="text-[9px] text-gray-400 leading-6">
          {t.tagline}
        </p>
      </div>

      {/* ── Card Packs (with background image) ─────────────────────────── */}
      <div className="relative flex-1 flex items-center justify-center px-4 md:px-8 py-8 overflow-hidden">
        {/* Background image */}
        <img
          src="/gacha-bg.png"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: 'center 55%', transform: 'scale(1.2)', transformOrigin: 'center', animation: 'bgPulse 4s ease-in-out infinite' }}
        />
        {/* Top/bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-monad-bg via-transparent to-monad-bg pointer-events-none" />
        {/* Side fade */}
        <div className="absolute inset-0 bg-gradient-to-r from-monad-bg/60 via-transparent to-monad-bg/60 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {pools?.map((pool, idx) => {
            const art = POOL_ART[idx] ?? POOL_ART[0]
            return (
              <div
                key={pool.id}
                className={`relative bg-black/50 backdrop-blur-sm border-4 ${art.border} ${art.glow} p-6 flex flex-col gap-4`}
              >
                {/* Pool badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[7px] font-bold px-3 py-1 border-2 border-black shadow-pixel-sm text-white ${art.badgeColor}`}>
                    {art.badge}
                  </span>
                  {pool.isActive ? (
                    <span className="flex items-center gap-1 text-[7px] text-monad-purple">
                      <span className="w-2 h-2 bg-monad-purple rounded-full animate-pulse" />
                      {t.active}
                    </span>
                  ) : (
                    <span className="text-[7px] text-red-400">{t.inactive}</span>
                  )}
                </div>

                {/* Pack visual */}
                <div className="flex items-center justify-center py-4 relative">
                  {art.ballImg ? (
                    <img
                      src={art.ballImg}
                      alt="pack"
                      className="w-24 h-24 pixelated animate-float drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : (
                    <div className="w-24 h-24 border-4 border-monad-purple bg-monad-dark flex items-center justify-center animate-float shadow-neon-purple">
                      <span className="text-3xl">⬡</span>
                    </div>
                  )}
                  {/* Particles */}
                  <div className="absolute top-2 left-8 w-2 h-2 bg-yellow-400 animate-pulse opacity-60" />
                  <div className="absolute bottom-2 right-8 w-1 h-1 bg-monad-purple animate-pulse opacity-80" />
                </div>

                {/* Pool name */}
                <div className="text-center">
                  <h3 className={`text-sm ${art.accent}`}>{pool.name}</h3>
                  <p className="text-[8px] text-gray-400 mt-1">
                    {pool.cardCount.toString()} {t.cardTypes}
                  </p>
                </div>

                {/* Price */}
                <div className="bg-black/60 border-2 border-gray-700 px-4 py-3 flex items-center justify-between">
                  <span className="text-[8px] text-gray-400">{t.pricePerPull}</span>
                  <span className={`text-sm font-bold ${art.accent}`}>
                    {formatEther(pool.priceWei)} MON
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setInfoPoolId(pool.id)}
                    className="flex-1 py-3 border-4 border-gray-600 text-gray-300 text-[8px] hover:border-monad-ice hover:text-monad-ice transition-colors shadow-pixel"
                  >
                    {t.viewPoolInfo}
                  </button>
                  <button
                    onClick={() => isConnected && pool.isActive && onSelectPool(pool.id)}
                    disabled={!isConnected || !pool.isActive}
                    className={`flex-1 py-3 border-4 border-black text-black text-[8px] font-bold shadow-pixel transition-all hover:brightness-110 active:shadow-pixel-active active:translate-y-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      idx === 0 ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-monad-purple text-white hover:bg-[#9481FA]'
                    }`}
                  >
                    {!isConnected ? t.connectWallet : t.openPack}
                  </button>
                </div>
              </div>
            )
          })}

          {/* Loading state */}
          {!pools && (
            <>
              {[0, 1].map((i) => (
                <div key={i} className="border-4 border-gray-700 bg-black/50 backdrop-blur-sm p-6 animate-pulse">
                  <div className="h-4 bg-gray-700 mb-4 w-24" />
                  <div className="h-24 bg-gray-800 mb-4 mx-auto w-24" />
                  <div className="h-3 bg-gray-700 mb-2" />
                  <div className="h-10 bg-gray-800" />
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="text-center py-6 border-t-4 border-gray-800 px-4">
        <p className="text-[7px] text-gray-600">POWERED BY MONAD TESTNET · SMART CONTRACT OPEN SOURCE</p>
        <p className="text-[7px] text-monad-purple mt-1">PopMON 泡姆 © 2025</p>
        <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
          <a
            href={`https://testnet.monadexplorer.com/address/${CONTRACTS.gachaPool}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[7px] text-monad-ice underline"
          >
            POOL CONTRACT ↗
          </a>
          <a
            href={`https://testnet.monadexplorer.com/address/${CONTRACTS.gachaCard}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[7px] text-monad-ice underline"
          >
            NFT CONTRACT ↗
          </a>
        </div>
      </footer>

      {/* ── Pool Info Modal ──────────────────────────────────────────────────── */}
      {infoPoolId !== null && (
        <PoolInfoModal poolId={infoPoolId} onClose={() => setInfoPoolId(null)} />
      )}
    </div>
  )
}
