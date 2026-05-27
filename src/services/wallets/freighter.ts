/**
 * Freighter wallet service.
 *
 * Wraps the @stellar/freighter-api browser extension API.
 * The SDK is mocked via the window.__freighter__ shim so the module works
 * without installing the npm package (no external dependency required at
 * build time). When the real extension is present it exposes the same
 * interface on window.freighterApi.
 *
 * Reference: https://www.freighter.app/docs/guide/introduction.html
 */

import type { StellarNetwork, PublicKey, XDR } from '@types'

// ─── Freighter browser-extension interface (subset we use) ───────────────────

interface FreighterApi {
  isConnected(): Promise<{ isConnected: boolean }>
  getPublicKey(): Promise<string>
  getNetwork(): Promise<string>
  getNetworkDetails(): Promise<{ network: string; networkPassphrase: string }>
  signTransaction(xdr: string, opts?: { network?: string; accountToSign?: string }): Promise<string>
}

/** Resolve the Freighter API from the browser extension or the dev shim. */
function getFreighterApi(): FreighterApi | null {
  if (typeof window === 'undefined') return null

  // Real extension injects window.freighterApi
  const w = window as Window & {
    freighterApi?: FreighterApi
    __freighter__?: FreighterApi
  }

  return w.freighterApi ?? w.__freighter__ ?? null
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Returns true when the Freighter extension is installed in the browser.
 */
export async function isFreighterInstalled(): Promise<boolean> {
  const api = getFreighterApi()
  if (!api) return false
  try {
    const { isConnected } = await api.isConnected()
    return isConnected
  } catch {
    return false
  }
}

/**
 * Request the user's public key from Freighter.
 * Throws if the extension is not installed or the user rejects the request.
 */
export async function connectFreighter(): Promise<PublicKey> {
  const api = getFreighterApi()
  if (!api) {
    throw new Error('Freighter wallet is not installed. Please install it from https://www.freighter.app')
  }
  const publicKey = await api.getPublicKey()
  if (!publicKey) {
    throw new Error('Freighter did not return a public key. The user may have rejected the request.')
  }
  return publicKey
}

/**
 * Get the network the user's Freighter is currently set to.
 */
export async function getFreighterNetwork(): Promise<StellarNetwork> {
  const api = getFreighterApi()
  if (!api) throw new Error('Freighter wallet is not installed.')

  const { network } = await api.getNetworkDetails()
  const normalised = network.toLowerCase()

  if (normalised.includes('testnet')) return 'testnet'
  if (normalised.includes('futurenet')) return 'futurenet'
  return 'mainnet'
}

/**
 * Sign a Stellar transaction XDR with Freighter.
 *
 * @param xdr           - base64-encoded transaction XDR
 * @param network       - Stellar network passphrase
 * @param accountToSign - optional specific account to sign with
 * @returns signed transaction XDR
 */
export async function signTransactionWithFreighter(
  xdr: XDR,
  network: string,
  accountToSign?: PublicKey,
): Promise<XDR> {
  const api = getFreighterApi()
  if (!api) throw new Error('Freighter wallet is not installed.')

  const signed = await api.signTransaction(xdr, { network, accountToSign })
  return signed
}
