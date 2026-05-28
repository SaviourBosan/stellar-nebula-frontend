import type { CSSProperties } from 'react'
import { TransactionHistory } from '../components/History'
import { getActiveStellarConfig } from '../config/stellar'
import { useWallet } from '../contexts/WalletContext'
import { useShipUpgrade } from '../hooks'

function ShipDashboard() {
  const { walletState } = useWallet()
  const accountId = walletState.publicKey
  const shipId = accountId ?? null
  const stellarConfig = getActiveStellarConfig()
  const { shipNFT, resourceSnapshot, quote, updatedStats, isLoading, error, executeUpgrade } =
    useShipUpgrade(shipId, accountId, stellarConfig)

  return (
    <section className="page-panel" style={dashboardShellStyle}>
      <div style={heroGridStyle}>
        <div>
          <p className="eyebrow">Ship Dashboard</p>
          <h1>Keep fleet systems in view.</h1>
          <p className="page-copy">
            Review ship NFT metadata, resource balances, and signed upgrade
            previews from one route.
          </p>
        </div>

        <aside style={summaryCardStyle}>
          <p style={summaryLabelStyle}>Active ship</p>
          <h2 style={summaryTitleStyle}>{shipNFT?.metadata.name ?? 'No ship loaded'}</h2>
          <p style={summaryCopyStyle}>
            {shipNFT?.metadata.model ?? 'Connect a wallet to pull NFT metadata.'}
          </p>
          {quote && (
            <div style={requirementGridStyle}>
              <div>
                <span style={metricLabelStyle}>Upgrade</span>
                <strong style={metricValueStyle}>{quote.canUpgrade ? 'Ready' : 'Blocked'}</strong>
              </div>
              <div>
                <span style={metricLabelStyle}>Updated hull</span>
                <strong style={metricValueStyle}>{updatedStats?.hull ?? '—'}</strong>
              </div>
            </div>
          )}
        </aside>
      </div>

      <div style={dashboardGridStyle}>
        <article style={cardStyle}>
          <p className="eyebrow">Asset Vault</p>
          <h2 style={cardHeadingStyle}>Resource inventory</h2>
          {resourceSnapshot ? (
            <ul style={assetListStyle}>
              {resourceSnapshot.balances.map((balance) => (
                <li key={`${balance.code}:${balance.issuer ?? 'native'}`} style={assetItemStyle}>
                  <span>
                    <strong>{balance.code}</strong>
                    <span style={assetMetaStyle}>{balance.definition?.label ?? 'Balance'}</span>
                  </span>
                  <span style={assetAmountStyle}>{balance.balance}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={cardCopyStyle}>No asset snapshot available yet.</p>
          )}
          {quote?.missing.length ? (
            <p style={warningStyle}>
              Missing resources: {quote.missing.map((item) => `${item.resource} (${item.deficit})`).join(', ')}
            </p>
          ) : null}
        </article>

        <article style={cardStyle}>
          <p className="eyebrow">Upgrade Runbook</p>
          <h2 style={cardHeadingStyle}>Ship upgrade preview</h2>
          <p style={cardCopyStyle}>
            {error ?? (isLoading ? 'Loading ship data...' : 'Build and submit the next upgrade transaction from your wallet.')}
          </p>

          {quote && (
            <dl style={statsGridStyle}>
              {Object.entries(quote.requirements).map(([label, value]) => (
                <div key={label} style={statItemStyle}>
                  <dt style={metricLabelStyle}>{label}</dt>
                  <dd style={metricValueStyle}>{String(value)}</dd>
                </div>
              ))}
            </dl>
          )}

          <button type="button" onClick={() => void executeUpgrade()} style={upgradeButtonStyle}>
            Execute upgrade
          </button>
        </article>
      </div>

      <TransactionHistory accountId={accountId} title="Recent activity" config={stellarConfig} />
    </section>
  )
}

export default ShipDashboard

const dashboardShellStyle: CSSProperties = {
  display: 'grid',
  gap: 24,
  maxWidth: 1160,
}

const heroGridStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.9fr)',
}

const summaryCardStyle: CSSProperties = {
  padding: 22,
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(50, 214, 165, 0.12), rgba(9, 17, 33, 0.92))',
  border: '1px solid rgba(50, 214, 165, 0.18)',
}

const summaryLabelStyle: CSSProperties = {
  margin: 0,
  color: '#32d6a5',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const summaryTitleStyle: CSSProperties = {
  margin: '0.4rem 0 0',
  fontSize: '1.5rem',
}

const summaryCopyStyle: CSSProperties = {
  margin: '0.6rem 0 0',
  color: '#c8d4e6',
}

const requirementGridStyle: CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  marginTop: 16,
}

const metricLabelStyle: CSSProperties = {
  display: 'block',
  color: '#8da2bd',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
}

const metricValueStyle: CSSProperties = {
  color: '#f8fbff',
  fontSize: '1rem',
}

const dashboardGridStyle: CSSProperties = {
  display: 'grid',
  gap: 18,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
}

const cardStyle: CSSProperties = {
  display: 'grid',
  gap: 14,
  padding: 22,
  borderRadius: 24,
  background: 'linear-gradient(180deg, rgba(9, 17, 33, 0.95), rgba(6, 12, 26, 0.98))',
  border: '1px solid rgba(159, 216, 255, 0.14)',
}

const cardHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.2rem',
}

const cardCopyStyle: CSSProperties = {
  margin: 0,
  color: '#c8d4e6',
}

const warningStyle: CSSProperties = {
  margin: 0,
  color: '#fdba74',
}

const assetListStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  margin: 0,
  padding: 0,
  listStyle: 'none',
}

const assetItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  padding: '12px 14px',
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.04)',
}

const assetMetaStyle: CSSProperties = {
  display: 'block',
  color: '#8da2bd',
  fontSize: '0.8rem',
}

const assetAmountStyle: CSSProperties = {
  color: '#f8fbff',
  fontSize: '1rem',
  fontWeight: 700,
}

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  margin: 0,
}

const statItemStyle: CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.04)',
}

const upgradeButtonStyle: CSSProperties = {
  marginTop: 4,
  padding: '0.85rem 1rem',
  borderRadius: 999,
  border: '1px solid rgba(50, 214, 165, 0.24)',
  background: 'linear-gradient(90deg, rgba(50, 214, 165, 0.95), rgba(159, 216, 255, 0.95))',
  color: '#07111f',
  fontWeight: 800,
}
