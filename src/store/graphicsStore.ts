import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface GraphicsState {
  bloomEnabled: boolean
  bloomIntensity: number
  performanceMode: boolean
  starfieldDensity: number
}

export interface GraphicsActions {
  setBloomEnabled: (enabled: boolean) => void
  setBloomIntensity: (intensity: number) => void
  setPerformanceMode: (enabled: boolean) => void
  setStarfieldDensity: (density: number) => void
}

export type GraphicsStore = GraphicsState & GraphicsActions

export const graphicsStoreStorageKey = 'stellar-nebula:graphics-store'

export const initialGraphicsState: GraphicsState = {
  bloomEnabled: true,
  bloomIntensity: 0.55,
  performanceMode: false,
  starfieldDensity: 0.85,
}

const clampBloomIntensity = (value: number) => Math.min(1.2, Math.max(0, value))
const clampStarfieldDensity = (value: number) => Math.min(1.5, Math.max(0.4, value))

export const useGraphicsStore = create<GraphicsStore>()(
  persist(
    (set) => ({
      ...initialGraphicsState,
      setBloomEnabled: (bloomEnabled) => set({ bloomEnabled }),
      setBloomIntensity: (bloomIntensity) => set({ bloomIntensity: clampBloomIntensity(bloomIntensity) }),
      setPerformanceMode: (performanceMode) => set({ performanceMode }),
      setStarfieldDensity: (starfieldDensity) =>
        set({ starfieldDensity: clampStarfieldDensity(starfieldDensity) }),
    }),
    {
      name: graphicsStoreStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ bloomEnabled, bloomIntensity, performanceMode, starfieldDensity }) => ({
        bloomEnabled,
        bloomIntensity,
        performanceMode,
        starfieldDensity,
      }),
    }
  )
)
