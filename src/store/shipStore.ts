import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ShipStatus = 'docked' | 'in-flight' | 'maintenance'

export interface Ship {
  id: string
  name: string
  model: string
  status: ShipStatus
  cargoCapacity: number
  crewCapacity: number
  lastKnownSector?: string
}

export interface ShipState {
  ships: Ship[]
  activeShipId: string | null
}

export interface ShipActions {
  setShips: (ships: Ship[]) => void
  upsertShip: (ship: Ship) => void
  removeShip: (shipId: string) => void
  setActiveShip: (shipId: string | null) => void
  updateShipStatus: (shipId: string, status: ShipStatus) => void
  resetShips: () => void
}

export type ShipStore = ShipState & ShipActions

export const shipStoreStorageKey = 'stellar-nebula:ship-store'

export const initialShipState: ShipState = {
  ships: [],
  activeShipId: null,
}

export const useShipStore = create<ShipStore>()(
  persist(
    (set) => ({
      ...initialShipState,
      setShips: (ships) => set({ ships }),
      upsertShip: (ship) =>
        set((state) => {
          const existingIndex = state.ships.findIndex((item) => item.id === ship.id)

          if (existingIndex === -1) {
            return { ships: [...state.ships, ship] }
          }

          const ships = [...state.ships]
          ships[existingIndex] = ship
          return { ships }
        }),
      removeShip: (shipId) =>
        set((state) => ({
          ships: state.ships.filter((ship) => ship.id !== shipId),
          activeShipId: state.activeShipId === shipId ? null : state.activeShipId,
        })),
      setActiveShip: (shipId) => set({ activeShipId: shipId }),
      updateShipStatus: (shipId, status) =>
        set((state) => ({
          ships: state.ships.map((ship) => (ship.id === shipId ? { ...ship, status } : ship)),
        })),
      resetShips: () => set(initialShipState),
    }),
    {
      name: shipStoreStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ ships, activeShipId }) => ({ ships, activeShipId }),
    }
  )
)
