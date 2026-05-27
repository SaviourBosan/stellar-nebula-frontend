import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import type { Group, Mesh } from 'three'

function NebulaSphere() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1
      meshRef.current.rotation.x += delta * 0.05
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshStandardMaterial
        color="#7c3aed"
        emissive="#4c1d95"
        emissiveIntensity={0.68}
        wireframe={false}
        transparent
        opacity={0.82}
      />
    </mesh>
  )
}

function ScanPoints() {
  const pointsRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z -= delta * 0.08
      pointsRef.current.rotation.y += delta * 0.12
    }
  })

  return (
    <group ref={pointsRef}>
      <mesh position={[2.2, 0.2, 0.4]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#67e8f9" toneMapped={false} />
      </mesh>
      <mesh position={[-1.9, 0.8, -0.2]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color="#c084fc" toneMapped={false} />
      </mesh>
      <mesh position={[0.9, -1.8, 0.6]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#f0abfc" toneMapped={false} />
      </mesh>
      <mesh position={[-0.7, 1.7, -0.5]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshBasicMaterial color="#a78bfa" toneMapped={false} />
      </mesh>
    </group>
  )
}

export function NebulaScene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#a78bfa" />
      <pointLight position={[-10, -5, -10]} intensity={0.8} color="#06b6d4" />
      <Stars radius={120} depth={60} count={8000} factor={4} fade speed={1} />
      <ScanPoints />
      <NebulaSphere />
    </>
  )
}
