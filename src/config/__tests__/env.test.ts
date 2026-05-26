import { describe, it, expect, vi, beforeEach } from 'vitest'

const VALID_ENV = {
  VITE_STELLAR_RPC_URL: 'https://soroban-testnet.stellar.org',
  VITE_STELLAR_HORIZON_URL: 'https://horizon-testnet.stellar.org',
  VITE_STELLAR_PASSPHRASE: 'Test SDF Network ; September 2015',
  VITE_NEBULA_CONTRACT_ID: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  VITE_TOKEN_CONTRACT_ID: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  VITE_API_BASE_URL: 'http://localhost:3000/api',
}

describe('env config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('loads valid env without throwing', async () => {
    vi.stubEnv('VITE_STELLAR_RPC_URL', VALID_ENV.VITE_STELLAR_RPC_URL)
    vi.stubEnv('VITE_STELLAR_HORIZON_URL', VALID_ENV.VITE_STELLAR_HORIZON_URL)
    vi.stubEnv('VITE_STELLAR_PASSPHRASE', VALID_ENV.VITE_STELLAR_PASSPHRASE)
    vi.stubEnv('VITE_NEBULA_CONTRACT_ID', VALID_ENV.VITE_NEBULA_CONTRACT_ID)
    vi.stubEnv('VITE_TOKEN_CONTRACT_ID', VALID_ENV.VITE_TOKEN_CONTRACT_ID)
    vi.stubEnv('VITE_API_BASE_URL', VALID_ENV.VITE_API_BASE_URL)

    await expect(import('../env')).resolves.toBeDefined()
    vi.unstubAllEnvs()
  })

  it('uses fallback values for optional variables', async () => {
    vi.stubEnv('VITE_STELLAR_RPC_URL', VALID_ENV.VITE_STELLAR_RPC_URL)
    vi.stubEnv('VITE_STELLAR_HORIZON_URL', VALID_ENV.VITE_STELLAR_HORIZON_URL)
    vi.stubEnv('VITE_STELLAR_PASSPHRASE', VALID_ENV.VITE_STELLAR_PASSPHRASE)
    vi.stubEnv('VITE_NEBULA_CONTRACT_ID', VALID_ENV.VITE_NEBULA_CONTRACT_ID)
    vi.stubEnv('VITE_TOKEN_CONTRACT_ID', VALID_ENV.VITE_TOKEN_CONTRACT_ID)
    vi.stubEnv('VITE_API_BASE_URL', VALID_ENV.VITE_API_BASE_URL)

    const { env } = await import('../env')
    expect(env.APP_NAME).toBe('Stellar Nebula')
    expect(env.API_TIMEOUT_MS).toBe(10000)
    vi.unstubAllEnvs()
  })
})
