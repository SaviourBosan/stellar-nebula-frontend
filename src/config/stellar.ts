import { Horizon, Networks, rpc } from '@stellar/stellar-sdk'

export type StellarNetwork = 'testnet' | 'futurenet' | 'mainnet'

export interface StellarEnvConfig {
  STELLAR_NETWORK?: StellarNetwork
  STELLAR_RPC_URL?: string
  STELLAR_HORIZON_URL?: string
  STELLAR_PASSPHRASE?: string
}

export interface StellarNetworkConfig {
  network: StellarNetwork
  rpcUrl: string
  horizonUrl: string
  networkPassphrase: string
}

export interface StellarConnectionClients {
  rpcServer: Pick<rpc.Server, 'getHealth' | 'getNetwork'>
  horizonServer: Pick<Horizon.Server, 'root'>
}

export interface StellarConnectionStatus {
  network: StellarNetwork
  rpcHealthy: boolean
  rpcStatus: string
  horizonConnected: boolean
  networkPassphrase: string
}

export const STELLAR_NETWORK_CONFIGS: Record<StellarNetwork, StellarNetworkConfig> = {
  testnet: {
    network: 'testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  },
  futurenet: {
    network: 'futurenet',
    rpcUrl: 'https://rpc-futurenet.stellar.org',
    horizonUrl: 'https://horizon-futurenet.stellar.org',
    networkPassphrase: Networks.FUTURENET,
  },
  mainnet: {
    network: 'mainnet',
    rpcUrl: 'https://soroban-rpc.stellar.org',
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: Networks.PUBLIC,
  },
}

export function getStellarNetworkConfig(network: StellarNetwork = 'testnet'): StellarNetworkConfig {
  return STELLAR_NETWORK_CONFIGS[network]
}

export function getStellarEnvConfig(): StellarEnvConfig {
  return {
    STELLAR_NETWORK: import.meta.env.VITE_STELLAR_NETWORK as StellarNetwork | undefined,
    STELLAR_RPC_URL: import.meta.env.VITE_STELLAR_RPC_URL,
    STELLAR_HORIZON_URL: import.meta.env.VITE_STELLAR_HORIZON_URL,
    STELLAR_PASSPHRASE: import.meta.env.VITE_STELLAR_PASSPHRASE,
  }
}

export function getActiveStellarConfig(
  config: StellarEnvConfig = getStellarEnvConfig()
): StellarNetworkConfig {
  const baseConfig = getStellarNetworkConfig(config.STELLAR_NETWORK ?? 'testnet')

  return {
    ...baseConfig,
    rpcUrl: config.STELLAR_RPC_URL || baseConfig.rpcUrl,
    horizonUrl: config.STELLAR_HORIZON_URL || baseConfig.horizonUrl,
    networkPassphrase: config.STELLAR_PASSPHRASE || baseConfig.networkPassphrase,
  }
}

export function createStellarRpcServer(
  config: StellarNetworkConfig = getActiveStellarConfig()
): rpc.Server {
  return new rpc.Server(config.rpcUrl)
}

export function createHorizonServer(
  config: StellarNetworkConfig = getActiveStellarConfig()
): Horizon.Server {
  return new Horizon.Server(config.horizonUrl)
}

export async function checkStellarConnection(
  config: StellarNetworkConfig = getActiveStellarConfig(),
  clients: StellarConnectionClients = {
    rpcServer: createStellarRpcServer(config),
    horizonServer: createHorizonServer(config),
  }
): Promise<StellarConnectionStatus> {
  const [health, networkInfo] = await Promise.all([
    clients.rpcServer.getHealth(),
    clients.rpcServer.getNetwork(),
    clients.horizonServer.root(),
  ])

  return {
    network: config.network,
    rpcHealthy: health.status === 'healthy',
    rpcStatus: health.status,
    horizonConnected: true,
    networkPassphrase: networkInfo.passphrase,
  }
}
