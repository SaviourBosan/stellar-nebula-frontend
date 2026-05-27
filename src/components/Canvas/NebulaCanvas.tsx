import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
import { NebulaScene } from './NebulaScene'
import { FpsCounter } from './FpsCounter'
import { BloomEffect } from '../Effects'
import { useGraphicsStore } from '@/store'

interface NebulaCanvasProps {
  showFps?: boolean
}

export function NebulaCanvas({ showFps = false }: NebulaCanvasProps) {
  const bloomEnabled = useGraphicsStore((state) => state.bloomEnabled)
  const bloomIntensity = useGraphicsStore((state) => state.bloomIntensity)
  const performanceMode = useGraphicsStore((state) => state.performanceMode)
  const starfieldDensity = useGraphicsStore((state) => state.starfieldDensity)
  const deviceHints = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
      }
    }

    const nav = navigator as Navigator & {
      userAgentData?: {
        mobile?: boolean
      }
    }

    return {
      isMobile:
        window.matchMedia('(pointer: coarse)').matches ||
        window.matchMedia('(max-width: 768px)').matches ||
        nav.userAgentData?.mobile === true,
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showFps && <FpsCounter />}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: !deviceHints.isMobile, powerPreference: 'high-performance' }}
        dpr={[1, deviceHints.isMobile ? 1.5 : 2]}
      >
        <Suspense fallback={null}>
          <NebulaScene starfieldDensity={starfieldDensity} performanceMode={performanceMode} />
          <BloomEffect
            enabled={bloomEnabled}
            intensity={bloomIntensity}
            performanceMode={performanceMode}
          />
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={20}
            autoRotate
            autoRotateSpeed={0.4}
          />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}
