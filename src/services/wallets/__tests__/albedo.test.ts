import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isAlbedoAvailable, connectAlbedo, signTransactionWithAlbedo } from '../albedo'

vi.mock('@albedo-link/intent', () => ({
  default: {
    publicKey: vi.fn(),
    tx: vi.fn(),
  },
}))

import albedo from '@albedo-link/intent'

describe('isAlbedoAvailable', () => {
  it('returns true when window is defined', () => {
    expect(isAlbedoAvailable()).toBe(true)
  })
})

describe('connectAlbedo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the public key on success', async () => {
    vi.mocked(albedo.publicKey).mockResolvedValue({ pubkey: 'GABC123', intent: 'public_key', signature: '' })
    const key = await connectAlbedo()
    expect(key).toBe('GABC123')
  })

  it('throws when no pubkey is returned', async () => {
    vi.mocked(albedo.publicKey).mockResolvedValue({ pubkey: '', intent: 'public_key', signature: '' })
    await expect(connectAlbedo()).rejects.toThrow('Albedo did not return a public key')
  })
})

describe('signTransactionWithAlbedo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the signed XDR on success', async () => {
    vi.mocked(albedo.tx).mockResolvedValue({
      signed_envelope_xdr: 'SIGNED_XDR',
      intent: 'tx',
      xdr: 'RAW_XDR',
      pubkey: 'GABC123',
      network: 'testnet',
    })
    const signed = await signTransactionWithAlbedo('RAW_XDR', 'testnet')
    expect(signed).toBe('SIGNED_XDR')
  })

  it('throws when no signed XDR is returned', async () => {
    vi.mocked(albedo.tx).mockResolvedValue({
      signed_envelope_xdr: '',
      intent: 'tx',
      xdr: 'RAW_XDR',
      pubkey: 'GABC123',
      network: 'testnet',
    })
    await expect(signTransactionWithAlbedo('RAW_XDR', 'testnet')).rejects.toThrow(
      'Albedo did not return a signed transaction',
    )
  })

  it('passes undefined network for mainnet (albedo default)', async () => {
    vi.mocked(albedo.tx).mockResolvedValue({
      signed_envelope_xdr: 'SIGNED_XDR',
      intent: 'tx',
      xdr: 'RAW_XDR',
      pubkey: 'GABC123',
      network: undefined,
    })
    await signTransactionWithAlbedo('RAW_XDR', 'mainnet')
    expect(albedo.tx).toHaveBeenCalledWith(
      expect.objectContaining({ network: undefined }),
    )
  })
})
