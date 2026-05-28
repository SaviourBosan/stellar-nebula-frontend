import * as StellarSdk from '@stellar/stellar-sdk'
import { createHorizonServer, getActiveStellarConfig } from '@/config/stellar'

export interface TrustlineAsset {
  code: string
  issuer: string
}

export interface TrustlineStatus {
  exists: boolean
  assetCode: string
  issuer: string
  balance: string
  limit: string
  nativeBalance: string
  subentryCount: number
  reserveDeltaXlm: string
  canAfford: boolean
}

export interface TrustlineTransactionDraft {
  xdr: string
  asset: TrustlineAsset
  limit: string
  baseFeeStroops: string
}

export interface TrustlineBalanceCheck {
  availableXlm: string
  requiredXlm: string
  canAfford: boolean
}

const BASE_RESERVE_XLM = 0.5
export const DEFAULT_TRUSTLINE_LIMIT = '922337203685.4775807'

function buildAsset(asset: TrustlineAsset): StellarSdk.Asset {
  return new StellarSdk.Asset(asset.code, asset.issuer)
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  if (typeof value !== 'string') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Fetch a user's trustline state for a given asset from Horizon.
 */
export async function fetchTrustlineStatus(
  publicKey: string,
  asset: TrustlineAsset,
): Promise<TrustlineStatus> {
  const config = getActiveStellarConfig()
  const horizon = createHorizonServer(config)
  const account = await horizon.accounts().accountId(publicKey).call()
  const balances = account.balances as Array<{
    asset_type: string
    asset_code?: string
    asset_issuer?: string
    balance?: string
    limit?: string
  }>

  const nativeBalanceLine = balances.find((line) => line.asset_type === 'native')
  const trustlineLine = balances.find(
    (line) => line.asset_type !== 'native' && line.asset_code === asset.code && line.asset_issuer === asset.issuer,
  )

  const subentryCount = toNumber(
    (account as unknown as { subentry_count?: number | string }).subentry_count,
  )
  const nativeBalance = toNumber(nativeBalanceLine?.balance)
  const currentReserve = (2 + subentryCount) * BASE_RESERVE_XLM
  const reserveDeltaXlm = BASE_RESERVE_XLM.toFixed(7)
  const canAfford = nativeBalance >= currentReserve + BASE_RESERVE_XLM

  return {
    exists: Boolean(trustlineLine),
    assetCode: asset.code,
    issuer: asset.issuer,
    balance: trustlineLine?.balance ?? '0',
    limit: trustlineLine?.limit ?? DEFAULT_TRUSTLINE_LIMIT,
    nativeBalance: nativeBalanceLine?.balance ?? '0',
    subentryCount,
    reserveDeltaXlm,
    canAfford,
  }
}

/**
 * Check whether the account can still afford the reserve impact of a new trustline.
 */
export function checkTrustlineReserve(
  nativeBalance: string,
  subentryCount: number,
  additionalTrustlines = 1,
): TrustlineBalanceCheck {
  const availableXlm = toNumber(nativeBalance) - (2 + subentryCount) * BASE_RESERVE_XLM
  const requiredXlm = additionalTrustlines * BASE_RESERVE_XLM

  return {
    availableXlm: availableXlm.toFixed(7),
    requiredXlm: requiredXlm.toFixed(7),
    canAfford: availableXlm >= requiredXlm,
  }
}

/**
 * Build a trustline transaction ready to be signed and submitted.
 */
export async function buildTrustlineTransaction(
  publicKey: string,
  asset: TrustlineAsset,
  limit?: string,
): Promise<TrustlineTransactionDraft> {
  const config = getActiveStellarConfig()
  const horizon = createHorizonServer(config)
  const account = await horizon.loadAccount(publicKey)
  const trustAsset = buildAsset(asset)

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset: trustAsset,
        limit: limit || DEFAULT_TRUSTLINE_LIMIT,
      }),
    )
    .setTimeout(180)
    .build()

  return {
    xdr: tx.toXDR(),
    asset,
    limit: limit || DEFAULT_TRUSTLINE_LIMIT,
    baseFeeStroops: StellarSdk.BASE_FEE,
  }
}

/**
 * Submit a signed trustline transaction XDR to Horizon.
 */
export async function submitTrustlineTransaction(signedXdr: string): Promise<unknown> {
  const config = getActiveStellarConfig()
  const horizon = createHorizonServer(config)
  const transaction = (StellarSdk.TransactionBuilder as unknown as {
    fromXDR: (xdr: string, networkPassphrase: string) => unknown
  }).fromXDR(signedXdr, config.networkPassphrase)

  return horizon.submitTransaction(transaction as never)
}
