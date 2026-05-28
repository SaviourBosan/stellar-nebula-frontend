import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface UserSession {
  id: string
  handle: string
  walletAddress?: string
  roles: string[]
}

export interface UserState {
  session: UserSession | null
  isAuthenticated: boolean
}

export interface UserActions {
  setSession: (session: UserSession) => void
  updateSession: (session: Partial<UserSession>) => void
  clearSession: () => void
}

export type UserStore = UserState & UserActions

export const userStoreStorageKey = 'stellar-nebula:user-store'

export const initialUserState: UserState = {
  session: null,
  isAuthenticated: false,
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...initialUserState,
      setSession: (session) => set({ session, isAuthenticated: true }),
      updateSession: (sessionUpdate) =>
        set((state) => {
          if (!state.session) {
            return state
          }

          return {
            session: {
              ...state.session,
              ...sessionUpdate,
            },
          }
        }),
      clearSession: () => set(initialUserState),
    }),
    {
      name: userStoreStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ session, isAuthenticated }) => ({ session, isAuthenticated }),
    }
  )
)
