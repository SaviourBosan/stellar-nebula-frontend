import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  connectFreighter,
  connectAlbedo,
  getFreighterNetwork,
  isFreighterInstalled,
  isAlbedoAvailable,
  signTransactionWithFreighter,
  signTransactionWithAlbedo,
} from '@services/wallets'
import type { WalletState, WalletType, XDR, StellarNetwork } from '@types'

// ─── Storage key ─────────────────────────────────────────────────────────────

const WALLET_STORAGE_KEY = 'stellar-nebula:wallet'

interface PersistedWallet {
  publicKey: string
  walletType: WalletType
  network: StellarNetwork
}

// ─── Context shape ────────────────────────────────────────────────────────────

export interface WalletContextValue {
  walletState: WalletState
  isLoading: boolean
  error: string | null
  isFreighterInstalled: boolean
  isAlbedoAvailable: boolean
  connect: (type: WalletType) => Promise<void>
  disconnect: () => void
  switchWallet: (type: WalletType) => Promise<void>
  signTransaction: (xdr: XDR) => Promise<XDR | null>
  clearError: () => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const WalletContext = createContext<WalletContextValue | null>(null)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_WALLET_STATE: WalletState = {
  isConnected: false,
  publicKey: null,
  walletType: null,
  network: null,
}

function loadPersistedWallet(): PersistedWallet | null {
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PersistedWallet) : null
  } catch {
    return null
  }
}

function persistWallet(wallet: PersistedWallet): void {
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet))
  } catch {
    // Ignore quota / private-browsing errors
  }
}

function clearPersistedWallet(): void {
  try {
    localStorage.removeItem(WALLET_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface WalletProviderProps {
  children: ReactNode
}

function buildInitialWalletState(): WalletState {
  const persisted = loadPersistedWallet()
  if (persisted) {
    return {
      isConnected: true,
      publicKey: persisted.publicKey,
      walletType: persisted.walletType,
      network: persisted.network,
    }
  }
  return INITIAL_WALLET_STATE
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>(buildInitialWalletState)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [freighterInstalled, setFreighterInstalled] = useState(false)
  const albedoAvailable = isAlbedoAvailable()

  // Check Freighter availability asynchronously
  useEffect(() => {
    isFreighterInstalled().then(setFreighterInstalled).catch(() => setFreighterInstalled(false))
  }, [])

  const connect = useCallback(async (type: WalletType) => {
    setIsLoading(true)
    setError(null)
    try {
      let publicKey: string
      let network: StellarNetwork

      if (type === 'freighter') {
        const installed = await isFreighterInstalled()
        if (!installed) {
          throw new Error('Freighter is not installed. Visit https://www.freighter.app to install it.')
        }
        publicKey = await connectFreighter()
        network = await getFreighterNetwork()
      } else if (type === 'albedo') {
        if (!isAlbedoAvailable()) {
          throw new Error('Albedo is not available in this environment.')
        }
        publicKey = await connectAlbedo()
        network = 'testnet'
      } else {
        throw new Error(`Wallet type "${type}" is not supported.`)
      }

      const newState: WalletState = { isConnected: true, publicKey, walletType: type, network }
      setWalletState(newState)
      persistWallet({ publicKey, walletType: type, network })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setWalletState(INITIAL_WALLET_STATE)
    setError(null)
    clearPersistedWallet()
  }, [])

  const switchWallet = useCallback(
    async (type: WalletType) => {
      if (walletState.isConnected) {
        clearPersistedWallet()
        setWalletState(INITIAL_WALLET_STATE)
      }
      await connect(type)
    },
    [walletState.isConnected, connect],
  )

  const signTransaction = useCallback(
    async (xdr: XDR): Promise<XDR | null> => {
      if (!walletState.isConnected || !walletState.network || !walletState.walletType) {
        setError('Wallet is not connected')
        return null
      }
      setIsLoading(true)
      setError(null)
      try {
        if (walletState.walletType === 'freighter') {
          const passphraseMap: Record<StellarNetwork, string> = {
            testnet: 'Test SDF Network ; September 2015',
            futurenet: 'Test SDF Future Network ; October 2022',
            mainnet: 'Public Global Stellar Network ; September 2015',
          }
          return await signTransactionWithFreighter(
            xdr,
            passphraseMap[walletState.network],
            walletState.publicKey ?? undefined,
          )
        }
        if (walletState.walletType === 'albedo') {
          return await signTransactionWithAlbedo(xdr, walletState.network)
        }
        throw new Error(`Signing not supported for wallet type "${walletState.walletType}"`)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign transaction'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [walletState],
  )

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<WalletContextValue>(
    () => ({
      walletState,
      isLoading,
      error,
      isFreighterInstalled: freighterInstalled,
      isAlbedoAvailable: albedoAvailable,
      connect,
      disconnect,
      switchWallet,
      signTransaction,
      clearError,
    }),
    [
      walletState,
      isLoading,
      error,
      freighterInstalled,
      albedoAvailable,
      connect,
      disconnect,
      switchWallet,
      signTransaction,
      clearError,
    ],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used inside <WalletProvider>')
  }
  return ctx
}
