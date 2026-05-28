/**
 * Albedo wallet service.
 *
 * Integrates Albedo's web-based signing intent flow — no browser extension
 * required. Albedo opens in a popup and prompts the user to approve the
 * action, which makes it ideal as a fallback for users without Freighter.
 *
 * Reference: https://albedo.link/docs
 */

import albedo from '@albedo-link/intent'
import type { PublicKey, XDR, StellarNetwork } from '@/types'

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Albedo is always "installed" because it runs in a web popup.
 * Returns false in non-browser environments.
 */
export function isAlbedoAvailable(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Request the user's public key via Albedo's `publicKey` intent.
 * Opens a popup — may be blocked on mobile or with strict popup settings.
 *
 * @throws if the popup is blocked or the user cancels
 */
export async function connectAlbedo(): Promise<PublicKey> {
  const result = await albedo.publicKey({
    require_existing: false,
  })

  if (!result.pubkey) {
    throw new Error('Albedo did not return a public key. The user may have cancelled the request.')
  }

  return result.pubkey
}

// ─── Transaction signing ──────────────────────────────────────────────────────

/**
 * Sign a Stellar transaction XDR using Albedo.
 *
 * @param xdr     - base64-encoded transaction XDR to sign
 * @param network - Stellar network ('testnet' | 'futurenet' | 'mainnet')
 * @returns signed transaction XDR
 * @throws if the popup is blocked or the user rejects the signing request
 */
export async function signTransactionWithAlbedo(xdr: XDR, network: StellarNetwork): Promise<XDR> {
  const albedoNetwork = network === 'mainnet' ? undefined : network

  const result = await albedo.tx({
    xdr,
    network: albedoNetwork,
    submit: false,
  })

  if (!result.signed_envelope_xdr) {
    throw new Error('Albedo did not return a signed transaction.')
  }

  return result.signed_envelope_xdr
}
