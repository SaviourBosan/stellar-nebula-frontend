import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useMemo } from 'react'
import { KernelSize } from 'postprocessing'

interface BloomEffectProps {
  enabled: boolean
  intensity: number
  performanceMode?: boolean
}

function useDeviceHints() {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        prefersReducedMotion: false,
      }
    }

    const nav = navigator as Navigator & {
      userAgentData?: {
        mobile?: boolean
      }
    }

    const isMobile =
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(max-width: 768px)').matches ||
      nav.userAgentData?.mobile === true

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return {
      isMobile,
      prefersReducedMotion,
    }
  }, [])
}

export function BloomEffect({ enabled, intensity, performanceMode = false }: BloomEffectProps) {
  const { isMobile, prefersReducedMotion } = useDeviceHints()
  const adaptiveMode = performanceMode || isMobile || prefersReducedMotion
  const effectiveIntensity = adaptiveMode ? Math.min(intensity, 0.42) : intensity

  if (!enabled) {
    return null
  }

  return (
    <EffectComposer
      enabled
      multisampling={0}
      enableNormalPass={false}
      resolutionScale={adaptiveMode ? 0.75 : 1}
    >
      <Bloom
        mipmapBlur={!adaptiveMode}
        kernelSize={KernelSize.SMALL}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.9}
        intensity={effectiveIntensity}
      />
    </EffectComposer>
  )
}
