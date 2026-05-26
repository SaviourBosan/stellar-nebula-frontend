import { useEffect, useRef, useState } from 'react'

export function FpsCounter() {
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const tick = () => {
      frameCountRef.current++
      const now = performance.now()
      const elapsed = now - lastTimeRef.current

      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed))
        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        padding: '2px 8px',
        background: 'rgba(0,0,0,0.6)',
        color: fps >= 50 ? '#4ade80' : fps >= 30 ? '#facc15' : '#f87171',
        fontFamily: 'monospace',
        fontSize: 12,
        borderRadius: 4,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 100,
      }}
    >
      {fps} FPS
    </div>
  )
}
