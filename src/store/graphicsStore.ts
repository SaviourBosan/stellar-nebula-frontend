import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface GraphicsState {
  bloomEnabled: boolean
  bloomIntensity: number
  performanceMode: boolean
}

export interface GraphicsActions {
  setBloomEnabled: (enabled: boolean) => void
  setBloomIntensity: (intensity: number) => void
  setPerformanceMode: (enabled: boolean) => void
}

export type GraphicsStore = GraphicsState & GraphicsActions

export const graphicsStoreStorageKey = 'stellar-nebula:graphics-store'

export const initialGraphicsState: GraphicsState = {
  bloomEnabled: true,
  bloomIntensity: 0.55,
  performanceMode: false,
}

const clampBloomIntensity = (value: number) => Math.min(1.2, Math.max(0, value))

export const useGraphicsStore = create<GraphicsStore>()(
  persist(
    (set) => ({
      ...initialGraphicsState,
      setBloomEnabled: (bloomEnabled) => set({ bloomEnabled }),
      setBloomIntensity: (bloomIntensity) => set({ bloomIntensity: clampBloomIntensity(bloomIntensity) }),
      setPerformanceMode: (performanceMode) => set({ performanceMode }),
    }),
    {
      name: graphicsStoreStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ bloomEnabled, bloomIntensity, performanceMode }) => ({
        bloomEnabled,
        bloomIntensity,
        performanceMode,
      }),
    }
  )
)
