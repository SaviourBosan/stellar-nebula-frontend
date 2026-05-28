import { createHorizonServer } from '@config/stellar'
import type { StellarNetworkConfig } from '@config/stellar'

export interface ResourceAssetDefinition {
  code: string
  label: string
  description: string
  accent: string
}

export interface ResourceAssetBalance {
  code: string
  issuer?: string
  balance: string
  isNative: boolean
  hasTrustline: boolean
  definition?: ResourceAssetDefinition
}

export interface ResourceAssetSnapshot {
  accountId: string
  updatedAt: string
  balances: ResourceAssetBalance[]
  missingTrustlines: ResourceAssetDefinition[]
}

interface AccountRecord {
  balances?: Array<{
    asset_type: string
    balance: string
    asset_code?: string
    asset_issuer?: string
  }>
}

interface CacheEnvelope {
  expiresAt: number
  snapshot: ResourceAssetSnapshot
}

export const RESOURCE_ASSET_DEFINITIONS: ResourceAssetDefinition[] = [
  {
    code: 'STARDUST',
    label: 'Stardust',
    description: 'Refined navigation fuel used for long-range routing.',
    accent: '#9fd8ff',
  },
  {
    code: 'NEBULITE',
    label: 'Nebulite',
    description: 'Primary construction material for lightweight hulls.',
    accent: '#32d6a5',
  },
  {
    code: 'COSMICDUST',
    label: 'Cosmic Dust',
    description: 'Rare particulate used to tune high-efficiency modules.',
    accent: '#f9a8d4',
  },
]

const CACHE_TTL_MS = 20_000

function getCacheKey(accountId: string): string {
  return `stellar-nebula:resource-assets:${accountId}`
}

function readCache(accountId: string): ResourceAssetSnapshot | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(getCacheKey(accountId))
    if (!raw) return null

    const parsed = JSON.parse(raw) as CacheEnvelope
    if (Date.now() > parsed.expiresAt) return null
    return parsed.snapshot
  } catch {
    return null
  }
}

function writeCache(snapshot: ResourceAssetSnapshot): void {
  if (typeof window === 'undefined') return

  try {
    const envelope: CacheEnvelope = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      snapshot,
    }
    window.localStorage.setItem(getCacheKey(snapshot.accountId), JSON.stringify(envelope))
  } catch {
    // Ignore storage failures in private browsing / low quota environments.
  }
}

function normalizeCode(code: string): string {
  return code.replace(/[^a-z0-9]/gi, '').toUpperCase()
}

function matchDefinition(code: string): ResourceAssetDefinition | undefined {
  const normalized = normalizeCode(code)
  return RESOURCE_ASSET_DEFINITIONS.find((definition) => normalizeCode(definition.code) === normalized)
}

export function clearResourceAssetCache(accountId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(getCacheKey(accountId))
}

export async function fetchResourceAssetSnapshot(
  accountId: string,
  config?: StellarNetworkConfig,
  options: { forceRefresh?: boolean } = {}
): Promise<ResourceAssetSnapshot> {
  if (!options.forceRefresh) {
    const cached = readCache(accountId)
    if (cached) return cached
  }

  const server = createHorizonServer(config)
  const account = (await server.accounts().accountId(accountId).call()) as AccountRecord

  const balances =
    account.balances?.map((balance) => {
      if (balance.asset_type === 'native') {
        return {
          code: 'XLM',
          balance: balance.balance,
          isNative: true,
          hasTrustline: true,
          definition: undefined,
        }
      }

      const code = balance.asset_code ?? 'UNKNOWN'
      const definition = matchDefinition(code)

      return {
        code,
        issuer: balance.asset_issuer,
        balance: balance.balance,
        isNative: false,
        hasTrustline: true,
        definition,
      }
    }) ?? []

  const activeCodes = new Set(
    balances
      .filter((balance) => !balance.isNative)
      .map((balance) => normalizeCode(balance.code))
  )

  const missingTrustlines = RESOURCE_ASSET_DEFINITIONS.filter(
    (definition) => !activeCodes.has(normalizeCode(definition.code))
  )

  const snapshot: ResourceAssetSnapshot = {
    accountId,
    updatedAt: new Date().toISOString(),
    balances,
    missingTrustlines,
  }

  writeCache(snapshot)
  return snapshot
}

export async function subscribeToResourceAssetUpdates(
  accountId: string,
  onUpdate: (snapshot: ResourceAssetSnapshot) => void,
  config?: StellarNetworkConfig
): Promise<() => void> {
  const server = createHorizonServer(config)
  const stream = server
    .payments()
    .forAccount(accountId)
    .cursor('now')
    .stream({
      onmessage: async () => {
        try {
          const snapshot = await fetchResourceAssetSnapshot(accountId, config, {
            forceRefresh: true,
          })
          onUpdate(snapshot)
        } catch {
          // The next message will retry the refresh.
        }
      },
      onerror: () => {
        // Keep the stream alive; Horizon reconnects automatically when possible.
      },
    })

  return () => {
    stream()
  }
}
