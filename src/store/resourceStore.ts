import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ResourceType = 'credits' | 'fuel' | 'minerals' | 'nebulaDust'

export type ResourceInventory = Record<ResourceType, number>

export interface ResourceState {
  inventory: ResourceInventory
}

export interface ResourceActions {
  setInventory: (inventory: ResourceInventory) => void
  setResource: (resource: ResourceType, amount: number) => void
  adjustResource: (resource: ResourceType, delta: number) => void
  resetResources: () => void
}

export type ResourceStore = ResourceState & ResourceActions

export const resourceStoreStorageKey = 'stellar-nebula:resource-store'

export const initialResourceState: ResourceState = {
  inventory: {
    credits: 0,
    fuel: 0,
    minerals: 0,
    nebulaDust: 0,
  },
}

export const useResourceStore = create<ResourceStore>()(
  persist(
    (set) => ({
      ...initialResourceState,
      setInventory: (inventory) => set({ inventory }),
      setResource: (resource, amount) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            [resource]: amount,
          },
        })),
      adjustResource: (resource, delta) =>
        set((state) => ({
          inventory: {
            ...state.inventory,
            [resource]: state.inventory[resource] + delta,
          },
        })),
      resetResources: () => set(initialResourceState),
    }),
    {
      name: resourceStoreStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ inventory }) => ({ inventory }),
    }
  )
)
