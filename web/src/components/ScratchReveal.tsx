import React, { useRef, useEffect, useState, useCallback } from 'react'

interface Props {
  onComplete: () => void
  isReady: boolean // true when tx is confirmed and card data is available
}

/**
 * Canvas-based scratch card reveal.
 * The user scratches the silver surface to reveal the card underneath.
 * Once ≥ 60% is revealed, onComplete() fires.
 */
export const ScratchReveal: React.FC<Props> = ({ onComplete, isReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [scratched, setScratched] = useState(0)
  const [done, setDone] = useState(false)
  const isDrawing = useRef(false)
  const completedRef = useRef(false)

  const SIZE = { w: 300, h: 400 }
  const SCRATCH_RADIUS = 28

  // Draw the scratchable silver layer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Silver gradient
    const grad = ctx.createLinearGradient(0, 0, SIZE.w, SIZE.h)
    grad.addColorStop(0, '#aaa')
    grad.addColorStop(0.5, '#eee')
    grad.addColorStop(1, '#999')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, SIZE.w, SIZE.h)

    // Texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 1
    for (let y = 0; y < SIZE.h; y += 6) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(SIZE.w, y)
      ctx.stroke()
    }

    // Hint text
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.font = '10px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SCRATCH HERE', SIZE.w / 2, SIZE.h / 2 - 10)
    ctx.fillText('TO REVEAL', SIZE.w / 2, SIZE.h / 2 + 10)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const scratch = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || done) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { x, y } = getPos(e, canvas)
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, SCRATCH_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      // Check percentage revealed
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let transparent = 0
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] < 128) transparent++
      }
      const total = canvas.width * canvas.height
      const pct = transparent / total
      setScratched(Math.round(pct * 100))

      if (pct >= 0.6 && !completedRef.current) {
        completedRef.current = true
        setDone(true)
        // Clear the rest
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onComplete()
      }
    },
    [done, onComplete]
  )

  return (
    <div className="flex flex-col items-center gap-4">
      {/* "Behind" layer – the card placeholder while we wait */}
      <div
        className="relative border-4 border-monad-purple"
        style={{ width: SIZE.w, maxWidth: '90vw' }}
      >
        {/* Card back placeholder visible beneath the scratch layer */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-monad-dark"
          style={{ zIndex: 0 }}
        >
          {isReady ? (
            <div className="text-center">
              <div className="text-3xl mb-2 animate-spin-slow">✦</div>
              <p className="text-[8px] text-monad-purple animate-blink">CARD READY!</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-monad-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[7px] text-gray-400 animate-blink">MINTING...</p>
            </div>
          )}
        </div>

        {/* Scratch overlay */}
        <canvas
          ref={canvasRef}
          width={SIZE.w}
          height={SIZE.h}
          style={{ position: 'relative', zIndex: 1, display: 'block', touchAction: 'none', cursor: 'crosshair' }}
          onMouseDown={() => { isDrawing.current = true }}
          onMouseUp={() => { isDrawing.current = false }}
          onMouseLeave={() => { isDrawing.current = false }}
          onMouseMove={scratch}
          onTouchStart={(e) => { e.preventDefault(); isDrawing.current = true; scratch(e) }}
          onTouchEnd={() => { isDrawing.current = false }}
          onTouchMove={(e) => { e.preventDefault(); scratch(e) }}
        />
      </div>

      {/* Progress bar */}
      <div className="w-full" style={{ maxWidth: SIZE.w }}>
        <div className="flex justify-between text-[7px] text-gray-500 mb-1">
          <span>SCRATCHED</span>
          <span>{scratched}%</span>
        </div>
        <div className="h-2 bg-gray-800 border-2 border-gray-600">
          <div
            className="h-full bg-monad-purple transition-all"
            style={{ width: `${Math.min(scratched, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-[7px] text-gray-500">
        {done ? '✓ REVEALED!' : isReady ? 'SCRATCH TO REVEAL YOUR CARD' : 'WAITING FOR TRANSACTION...'}
      </p>
    </div>
  )
}
