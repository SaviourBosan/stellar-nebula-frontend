import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Preload } from '@react-three/drei'
import { NebulaScene } from './NebulaScene'
import { FpsCounter } from './FpsCounter'

interface NebulaCanvasProps {
  showFps?: boolean
}

export function NebulaCanvas({ showFps = false }: NebulaCanvasProps) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showFps && <FpsCounter />}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <NebulaScene />
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
