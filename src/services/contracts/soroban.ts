import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk'
import { getActiveStellarConfig } from '@/config/stellar'
import type { StellarNetworkConfig } from '@/config/stellar'
import type { ResourceType } from '@/types/game'
import type { XDR } from '@/types'

export interface ScanNebulaParams {
  nebulaId: string
  scannerPublicKey: string
}

export interface ScanNebulaResult {
  resourceType: ResourceType
  amount: number
  transactionHash: string
}

export interface ContractCallOptions {
  fee?: string
  timeoutSeconds?: number
}

export class ContractError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContractError'
  }
}

const RESOURCE_TYPE_MAP: Record<string, ResourceType> = {
  nebulite: 'nebulite',
  stellarium: 'stellarium',
  voidcrystal: 'voidcrystal',
  dark_matter: 'darkMatter',
}

const POLL_INTERVAL_MS = 1000
const MAX_POLL_ATTEMPTS = 20

export class SorobanContractClient {
  private readonly server: rpc.Server
  private readonly config: StellarNetworkConfig
  private readonly contractId: string

  constructor(contractId: string, config: StellarNetworkConfig = getActiveStellarConfig()) {
    this.contractId = contractId
    this.config = config
    this.server = new rpc.Server(config.rpcUrl)
  }

  async buildScanTransaction(
    params: ScanNebulaParams,
    options: ContractCallOptions = {}
  ): Promise<XDR> {
    const { nebulaId, scannerPublicKey } = params
    const fee = options.fee ?? BASE_FEE
    const timeoutSeconds = options.timeoutSeconds ?? 30

    const account = await this.server.getAccount(scannerPublicKey)
    const contract = new Contract(this.contractId)

    const tx = new TransactionBuilder(account, {
      fee,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(
        contract.call(
          'scan_nebula',
          nativeToScVal(nebulaId, { type: 'string' }),
          nativeToScVal(scannerPublicKey, { type: 'address' })
        )
      )
      .setTimeout(timeoutSeconds)
      .build()

    const prepared = await this.server.prepareTransaction(tx)
    return prepared.toXDR()
  }

  async submitScanTransaction(signedXdr: XDR): Promise<ScanNebulaResult> {
    const tx = TransactionBuilder.fromXDR(signedXdr, this.config.networkPassphrase)
    const sendResult = await this.server.sendTransaction(tx)

    if (sendResult.status === 'ERROR') {
      const errXdr = (sendResult as { errorResult?: { toXDR: (fmt: string) => string } })
        .errorResult
      throw new ContractError(
        `Transaction submission failed: ${errXdr?.toXDR('base64') ?? 'unknown error'}`
      )
    }

    const finalResult = await this.pollTransaction(sendResult.hash)
    const parsed = this.parseScanResult(finalResult)

    return { ...parsed, transactionHash: sendResult.hash }
  }

  private async pollTransaction(hash: string): Promise<rpc.Api.GetSuccessfulTransactionResponse> {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      const result = await this.server.getTransaction(hash)

      if (result.status === 'SUCCESS') {
        return result as rpc.Api.GetSuccessfulTransactionResponse
      }
      if (result.status === 'FAILED') {
        throw new ContractError('Transaction failed on-chain')
      }
    }
    throw new ContractError('Transaction confirmation timed out')
  }

  private parseScanResult(
    result: rpc.Api.GetSuccessfulTransactionResponse
  ): Omit<ScanNebulaResult, 'transactionHash'> {
    if (!result.returnValue) {
      throw new ContractError('Contract returned no value')
    }

    const native = scValToNative(result.returnValue) as {
      resource_type: string
      amount: bigint | number
    }

    const resourceType = RESOURCE_TYPE_MAP[native.resource_type] ?? 'nebulite'
    const amount = Number(native.amount)

    return { resourceType, amount }
  }
}
