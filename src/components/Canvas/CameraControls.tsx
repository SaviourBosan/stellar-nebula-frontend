import { useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3 } from 'three'

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_DISTANCE = 2
const MAX_DISTANCE = 25
const DAMPING_FACTOR = 0.08
const AUTO_ROTATE_SPEED = 0.3
const KEYBOARD_ORBIT_SPEED = 2.2
const KEYBOARD_ZOOM_SPEED = 0.8
const PRECISION_MODIFIER = 0.3

// ─── Component ────────────────────────────────────────────────────────────────

interface CameraControlsProps {
  isMobile?: boolean
  performanceMode?: boolean
}

export function CameraControls({ isMobile = false, performanceMode = false }: CameraControlsProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl } = useThree()
  const keysDown = useRef(new Set<string>())

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysDown.current.add(key)

      if (key === 'r' && !e.ctrlKey && !e.metaKey) {
        controlsRef.current?.reset()
      }
      if (key === ' ' && gl.domElement === e.target) {
        e.preventDefault()
        if (controlsRef.current) {
          controlsRef.current.autoRotate = !controlsRef.current.autoRotate
        }
      }
    },
    [gl]
  )

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysDown.current.delete(e.key.toLowerCase())
  }, [])

  useEffect(() => {
    const canvas = gl.domElement
    canvas.setAttribute('tabindex', '0')
    canvas.addEventListener('keydown', handleKeyDown)
    canvas.addEventListener('keyup', handleKeyUp)
    return () => {
      canvas.removeEventListener('keydown', handleKeyDown)
      canvas.removeEventListener('keyup', handleKeyUp)
    }
  }, [gl, handleKeyDown, handleKeyUp])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    const keys = keysDown.current
    if (keys.size === 0) return

    const shift = keys.has('shift')
    const orbitSpeed = KEYBOARD_ORBIT_SPEED * delta * (shift ? PRECISION_MODIFIER : 1)

    if (keys.has('a') || keys.has('arrowleft')) {
      controls.rotate(-orbitSpeed, 0)
    }
    if (keys.has('d') || keys.has('arrowright')) {
      controls.rotate(orbitSpeed, 0)
    }
    if (keys.has('w') || keys.has('arrowup')) {
      controls.rotate(0, -orbitSpeed)
    }
    if (keys.has('s') || keys.has('arrowdown')) {
      controls.rotate(0, orbitSpeed)
    }

    const zoomSpeed = KEYBOARD_ZOOM_SPEED * delta * (shift ? PRECISION_MODIFIER : 1)
    const target = controls.target
    const offset = new Vector3().subVectors(camera.position, target)
    const currentDist = offset.length()

    if (keys.has('q')) {
      const newDist = Math.max(MIN_DISTANCE, currentDist * (1 - zoomSpeed))
      offset.normalize().multiplyScalar(newDist)
      camera.position.copy(target.clone().add(offset))
      controls.update()
    }
    if (keys.has('e')) {
      const newDist = Math.min(MAX_DISTANCE, currentDist * (1 + zoomSpeed))
      offset.normalize().multiplyScalar(newDist)
      camera.position.copy(target.clone().add(offset))
      controls.update()
    }
  })

  const effectiveDamping = performanceMode ? DAMPING_FACTOR * 1.5 : DAMPING_FACTOR

  return (
    <OrbitControls
      ref={controlsRef}
      domElement={gl.domElement}
      enableDamping
      dampingFactor={effectiveDamping}
      enableZoom
      enableRotate
      enablePan={isMobile}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI - 0.05}
      autoRotate
      autoRotateSpeed={AUTO_ROTATE_SPEED}
      zoomSpeed={isMobile ? 0.6 : 1}
      rotateSpeed={isMobile ? 0.4 : 0.6}
      panSpeed={isMobile ? 0.5 : 0.8}
    />
  )
}
