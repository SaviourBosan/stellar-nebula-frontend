export type Environment = 'development' | 'staging' | 'production'

export interface EnvConfig {
  // App
  NODE_ENV: Environment
  APP_NAME: string
  APP_VERSION: string

  // Stellar Network
  STELLAR_NETWORK: 'testnet' | 'mainnet' | 'futurenet'
  STELLAR_RPC_URL: string
  STELLAR_HORIZON_URL: string
  STELLAR_PASSPHRASE: string

  // Contract IDs
  NEBULA_CONTRACT_ID: string
  TOKEN_CONTRACT_ID: string

  // API
  API_BASE_URL: string
  API_TIMEOUT_MS: number

  // Feature flags
  ENABLE_DEV_TOOLS: boolean
  ENABLE_FPS_COUNTER: boolean
}

const REQUIRED_VARS = [
  'VITE_STELLAR_RPC_URL',
  'VITE_STELLAR_HORIZON_URL',
  'VITE_STELLAR_PASSPHRASE',
  'VITE_NEBULA_CONTRACT_ID',
  'VITE_TOKEN_CONTRACT_ID',
  'VITE_API_BASE_URL',
] as const

function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(
    (key) => !import.meta.env[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n\nSee .env.example for reference.`
    )
  }
}

function getEnv(): EnvConfig {
  validateEnv()

  const nodeEnv = (import.meta.env.VITE_APP_ENV ?? import.meta.env.MODE) as Environment

  return {
    NODE_ENV: nodeEnv,
    APP_NAME: import.meta.env.VITE_APP_NAME ?? 'Stellar Nebula',
    APP_VERSION: import.meta.env.VITE_APP_VERSION ?? '0.0.0',

    STELLAR_NETWORK: (import.meta.env.VITE_STELLAR_NETWORK ?? 'testnet') as EnvConfig['STELLAR_NETWORK'],
    STELLAR_RPC_URL: import.meta.env.VITE_STELLAR_RPC_URL,
    STELLAR_HORIZON_URL: import.meta.env.VITE_STELLAR_HORIZON_URL,
    STELLAR_PASSPHRASE: import.meta.env.VITE_STELLAR_PASSPHRASE,

    NEBULA_CONTRACT_ID: import.meta.env.VITE_NEBULA_CONTRACT_ID,
    TOKEN_CONTRACT_ID: import.meta.env.VITE_TOKEN_CONTRACT_ID,

    API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    API_TIMEOUT_MS: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 10000),

    ENABLE_DEV_TOOLS: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
    ENABLE_FPS_COUNTER: import.meta.env.VITE_ENABLE_FPS_COUNTER === 'true',
  }
}

export const env = getEnv()

export const isDev = env.NODE_ENV === 'development'
export const isStaging = env.NODE_ENV === 'staging'
export const isProd = env.NODE_ENV === 'production'
