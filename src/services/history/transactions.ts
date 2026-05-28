import type { StellarNetworkConfig } from '@config/stellar'

export interface HistoryOperation {
  type: string
  source_account?: string
  asset_code?: string
  asset_issuer?: string
  amount?: string
  from?: string
  to?: string
  contract_id?: string
  function?: string
}

export interface HistoryTransaction {
  hash: string
  successful: boolean
  created_at: string
  source_account: string
  memo_type?: string
  memo?: string
  fee_charged: string
  operation_count: number
  operations: HistoryOperation[]
}

export interface TransactionHistoryPage {
  records: HistoryTransaction[]
  nextHref: string | null
}

interface HorizonPage<T> {
  records: T[]
  _links?: {
    next?: {
      href: string
    }
  }
}

const KEYWORDS = ['ship', 'upgrade', 'scan', 'market', 'nebula', 'stardust', 'nft']

function buildHorizonUrl(
  accountId: string,
  config: StellarNetworkConfig | undefined,
  cursor?: string,
  limit = 10
): string {
  const base = (config?.horizonUrl ?? 'https://horizon-testnet.stellar.org').replace(/\/+$/, '')
  const url = new URL(`${base}/accounts/${accountId}/transactions`)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('order', 'desc')

  if (cursor) {
    url.searchParams.set('cursor', cursor)
  }

  return url.toString()
}

async function fetchPage<T>(url: string): Promise<HorizonPage<T>> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch transaction history (${response.status})`)
  }

  return response.json() as Promise<HorizonPage<T>>
}

async function fetchOperationsForTransaction(
  hash: string,
  config?: StellarNetworkConfig
): Promise<HistoryOperation[]> {
  const base = (config?.horizonUrl ?? 'https://horizon-testnet.stellar.org').replace(/\/+$/, '')
  const response = await fetch(`${base}/transactions/${hash}/operations?limit=20&order=asc`)
  if (!response.ok) return []

  const payload = (await response.json()) as HorizonPage<HistoryOperation>
  return payload.records ?? []
}

function getOperationSummary(operation: HistoryOperation): string {
  if (operation.type === 'payment') {
    const asset = operation.asset_code ?? 'XLM'
    const amount = operation.amount ?? '0'
    return `${amount} ${asset}`
  }

  if (operation.type === 'invoke_host_function') {
    const contract = operation.contract_id ? operation.contract_id.slice(0, 6) : 'contract'
    const fn = operation.function ?? 'invoke'
    return `${contract}:${fn}`
  }

  return operation.type.replace(/_/g, ' ')
}

function transactionIsRelevant(tx: HistoryTransaction): boolean {
  const memoText = `${tx.memo ?? ''} ${tx.memo_type ?? ''}`.toLowerCase()
  if (KEYWORDS.some((keyword) => memoText.includes(keyword))) return true
  return tx.operations.some((operation) => {
    if (operation.type === 'invoke_host_function') return true
    if (operation.type === 'payment') {
      return KEYWORDS.some((keyword) =>
        (operation.asset_code ?? '').toLowerCase().includes(keyword)
      )
    }
    return false
  })
}

export function summarizeHistoryOperation(operation: HistoryOperation): string {
  return getOperationSummary(operation)
}

export async function loadTransactionHistoryPage(
  accountId: string,
  config?: StellarNetworkConfig,
  cursorOrHref?: string,
  limit = 10
): Promise<TransactionHistoryPage> {
  const page = await fetchPage<HistoryTransaction>(
    cursorOrHref?.startsWith('http')
      ? cursorOrHref
      : buildHorizonUrl(accountId, config, cursorOrHref, limit)
  )

  const records = await Promise.all(
    (page.records ?? []).map(async (tx) => {
      const operations = await fetchOperationsForTransaction(tx.hash, config)
      return { ...tx, operations }
    })
  )

  return {
    records: records.filter(transactionIsRelevant),
    nextHref: page._links?.next?.href ?? null,
  }
}
