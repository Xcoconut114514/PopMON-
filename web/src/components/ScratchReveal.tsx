import React, { useRef, useEffect, useState, useCallback } from 'react'

interface Props {
  onComplete: () => void
  isReady: boolean
}

const W = 280
const H = 380

export const ScratchReveal: React.FC<Props> = ({ onComplete, isReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scratched, setScratched] = useState(0)
  const [done, setDone] = useState(false)
  const isDrawing = useRef(false)
  const completedRef = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // ── Draw holographic foil scratch layer ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // 1. Base holographic gradient
    const mainGrad = ctx.createLinearGradient(0, 0, W, H)
    mainGrad.addColorStop(0.00, '#9C8ECC')
    mainGrad.addColorStop(0.12, '#D8D0F0')
    mainGrad.addColorStop(0.25, '#BCA8E8')
    mainGrad.addColorStop(0.38, '#E8D080')
    mainGrad.addColorStop(0.50, '#A8C8E8')
    mainGrad.addColorStop(0.62, '#E8A8D8')
    mainGrad.addColorStop(0.75, '#C8D8A0')
    mainGrad.addColorStop(0.88, '#C0B8E8')
    mainGrad.addColorStop(1.00, '#A8A8C8')
    ctx.fillStyle = mainGrad
    ctx.fillRect(0, 0, W, H)

    // 2. Diagonal shimmer bands
    for (let i = -2; i < 14; i++) {
      const x = (i / 12) * (W + H) - H * 0.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + H * 0.7, H)
      ctx.lineTo(x + H * 0.7 + 18, H)
      ctx.lineTo(x + 18, 0)
      ctx.closePath()
      ctx.fillStyle = `rgba(255,255,255,${i % 3 === 0 ? 0.12 : 0.04})`
      ctx.fill()
    }

    // 3. Fine metallic noise
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * W
      const y = Math.random() * H
      const size = Math.random() < 0.85 ? 1 : 1.5
      ctx.fillStyle = Math.random() > 0.5
        ? `rgba(255,255,255,${Math.random() * 0.18})`
        : `rgba(0,0,0,${Math.random() * 0.12})`
      ctx.fillRect(x, y, size, size)
    }

    // 4. Sparkle marks
    const sparkle = (sx: number, sy: number, size: number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(sx, sy - size); ctx.lineTo(sx, sy + size)
      ctx.moveTo(sx - size, sy); ctx.lineTo(sx + size, sy)
      ctx.stroke()
      const d = size * 0.6
      ctx.lineWidth = 1
      ctx.strokeStyle = color.replace('1)', '0.5)')
      ctx.beginPath()
      ctx.moveTo(sx - d, sy - d); ctx.lineTo(sx + d, sy + d)
      ctx.moveTo(sx + d, sy - d); ctx.lineTo(sx - d, sy + d)
      ctx.stroke()
    }
    sparkle(44, 58, 11, 'rgba(255,220,0,1)')
    sparkle(234, 72, 9, 'rgba(200,170,255,1)')
    sparkle(42, 310, 13, 'rgba(255,220,0,1)')
    sparkle(238, 340, 8, 'rgba(200,170,255,1)')
    sparkle(140, 44, 10, 'rgba(255,220,0,1)')

    // 5. Border frame
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2.5
    ctx.strokeRect(7, 7, W - 14, H - 14)
    ctx.strokeStyle = 'rgba(160,130,230,0.4)'
    ctx.lineWidth = 1
    ctx.strokeRect(13, 13, W - 26, H - 26)

    // 6. Header banner
    const hGrad = ctx.createLinearGradient(0, 22, W, 22)
    hGrad.addColorStop(0, 'rgba(0,0,0,0)')
    hGrad.addColorStop(0.15, 'rgba(20,10,50,0.75)')
    hGrad.addColorStop(0.85, 'rgba(20,10,50,0.75)')
    hGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = hGrad
    ctx.fillRect(18, 24, W - 36, 38)

    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 8px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.shadowColor = '#FFD700'
    ctx.shadowBlur = 6
    ctx.fillText('★ POPMON LUCKY CARD ★', W / 2, 38)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#C8A8F8'
    ctx.font = '6px "Press Start 2P", monospace'
    ctx.fillText('MONAD TESTNET NFT', W / 2, 54)

    // 7. Center instruction
    const midGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 90)
    midGrad.addColorStop(0, 'rgba(30,15,70,0.82)')
    midGrad.addColorStop(1, 'rgba(30,15,70,0)')
    ctx.fillStyle = midGrad
    ctx.fillRect(0, H / 2 - 80, W, 160)

    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = '#836EF9'
    ctx.shadowBlur = 10
    ctx.font = 'bold 12px "Press Start 2P", monospace'
    ctx.fillText('🪙 SCRATCH', W / 2, H / 2 - 14)
    ctx.fillText('TO REVEAL', W / 2, H / 2 + 12)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(200,180,240,0.8)'
    ctx.font = '7px "Press Start 2P", monospace'
    ctx.fillText('your NFT card inside', W / 2, H / 2 + 34)

    // 8. Bottom strip
    const bGrad = ctx.createLinearGradient(0, H - 52, W, H - 52)
    bGrad.addColorStop(0, 'rgba(131,110,249,0)')
    bGrad.addColorStop(0.15, 'rgba(131,110,249,0.5)')
    bGrad.addColorStop(0.85, 'rgba(131,110,249,0.5)')
    bGrad.addColorStop(1, 'rgba(131,110,249,0)')
    ctx.fillStyle = bGrad
    ctx.fillRect(18, H - 52, W - 36, 30)
    ctx.fillStyle = '#C8D8F8'
    ctx.font = '6px "Press Start 2P", monospace'
    ctx.fillText('◆ SCRATCH · COLLECT · WIN ◆', W / 2, H - 32)
  }, [])

  // ── Position helper ──────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy }
    }
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy }
  }

  // ── Scratch logic ────────────────────────────────────────────────────────
  const doScratch = useCallback(
    (x: number, y: number) => {
      if (done) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')!

      ctx.globalCompositeOperation = 'destination-out'

      // Feathered circular eraser
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 52)
      grad.addColorStop(0.00, 'rgba(0,0,0,1)')
      grad.addColorStop(0.55, 'rgba(0,0,0,0.95)')
      grad.addColorStop(0.82, 'rgba(0,0,0,0.45)')
      grad.addColorStop(1.00, 'rgba(0,0,0,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, 52, 0, Math.PI * 2)
      ctx.fill()

      // Interpolate for smooth trails
      if (lastPos.current) {
        const { x: lx, y: ly } = lastPos.current
        const dist = Math.hypot(x - lx, y - ly)
        const steps = Math.max(1, Math.floor(dist / 6))
        for (let i = 1; i <= steps; i++) {
          const ix = lx + ((x - lx) * i) / steps
          const iy = ly + ((y - ly) * i) / steps
          const g2 = ctx.createRadialGradient(ix, iy, 0, ix, iy, 40)
          g2.addColorStop(0, 'rgba(0,0,0,0.95)')
          g2.addColorStop(0.65, 'rgba(0,0,0,0.55)')
          g2.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.fillStyle = g2
          ctx.beginPath()
          ctx.arc(ix, iy, 40, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      lastPos.current = { x, y }
      ctx.globalCompositeOperation = 'source-over'

      // Sample every 4th pixel for performance
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let transparent = 0
      for (let i = 3; i < imgData.data.length; i += 16) {
        if (imgData.data[i] < 128) transparent++
      }
      const pct = transparent / (canvas.width * canvas.height / 4)
      setScratched(Math.round(pct * 100))

      if (pct >= 0.55 && !completedRef.current) {
        completedRef.current = true
        setDone(true)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onComplete()
      }
    },
    [done, onComplete]
  )

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isReady) return
    isDrawing.current = true
    lastPos.current = null
    const p = getPos(e, canvasRef.current!)
    doScratch(p.x, p.y)
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return
    const p = getPos(e, canvasRef.current!)
    doScratch(p.x, p.y)
  }
  const onMouseUp = () => { isDrawing.current = false; lastPos.current = null }

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isReady) return
    isDrawing.current = true
    lastPos.current = null
    const p = getPos(e, canvasRef.current!)
    doScratch(p.x, p.y)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const p = getPos(e, canvasRef.current!)
    doScratch(p.x, p.y)
  }
  const onTouchEnd = () => { isDrawing.current = false; lastPos.current = null }

  const hint = scratched < 10
    ? '🪙 任意位置开始刮！'
    : scratched < 40 ? '✨ 继续...' : '🎉 快揭晓了！'

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative border-2 border-monad-purple shadow-[0_0_30px_rgba(131,110,249,0.4)]"
        style={{ width: W, maxWidth: '92vw' }}
      >
        {/* Background beneath scratch layer — cyberpunk city */}
        <div
          className="absolute inset-0 overflow-hidden flex items-center justify-center"
          style={{ zIndex: 0 }}
        >
          <img
            src="/city-bg.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
            style={{ objectPosition: 'center bottom', opacity: 0.9 }}
          />
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
          <div className="relative z-10 text-center px-4">
            {isReady ? (
              <>
                <div className="text-4xl mb-3" style={{ animation: 'spin 3s linear infinite' }}>✦</div>
                <p className="text-[9px] text-monad-purple font-pixel" style={{ animation: 'blink 1.2s step-end infinite' }}>NFT 已铸造！</p>
                <p className="text-[7px] text-gray-400 font-pixel mt-2">开始刮卡...</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 border-4 border-monad-purple border-t-yellow-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-[8px] text-gray-300 font-pixel" style={{ animation: 'blink 1.2s step-end infinite' }}>Monad 链上铸造中...</p>
                <p className="text-[7px] text-yellow-400 font-pixel mt-2 animate-pulse">⚡ ~1 秒确认</p>
              </>
            )}
          </div>
        </div>

        {/* Holographic scratch canvas */}
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className={isReady ? 'cursor-crosshair' : 'cursor-wait'}
          style={{ position: 'relative', zIndex: 1, display: 'block', width: '100%', height: 'auto', touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {/* Progress stripe */}
        {scratched > 2 && !done && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800" style={{ zIndex: 2 }}>
            <div
              className="h-full transition-all duration-100"
              style={{
                width: `${Math.min(scratched, 100)}%`,
                background: 'linear-gradient(to right, #836EF9, #F59E0B)'
              }}
            />
          </div>
        )}
      </div>

      {/* Status hint */}
      <div className="text-center">
        {done ? (
          <p className="text-[8px] text-yellow-400 font-pixel" style={{ animation: 'blink 0.6s step-end infinite' }}>✦ 揭晓！</p>
        ) : isReady ? (
          <p className="text-[8px] text-monad-ice font-pixel">{hint}</p>
        ) : (
          <p className="text-[7px] text-gray-500 font-pixel">等待 Monad 确认...</p>
        )}
      </div>
    </div>
  )
}
