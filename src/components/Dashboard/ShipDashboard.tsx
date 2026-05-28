import { useEffect, useMemo, useRef, useState } from 'react'
import { Inventory } from '../Resources/Inventory'
import { SHIP_UPGRADES, UpgradeModal, type ShipUpgradeOption } from '../Ship/UpgradeModal'
import { useResourceStore, useShipStore, type ResourceInventory, type ResourceType, type Ship } from '../../store'

const DEMO_SHIPS: Ship[] = [
  {
    id: 'aurora-wake',
    name: 'Aurora Wake',
    model: 'Explorer Mk II',
    status: 'docked',
    cargoCapacity: 320,
    crewCapacity: 12,
    lastKnownSector: 'Orion Drift',
  },
  {
    id: 'nebula-runner',
    name: 'Nebula Runner',
    model: 'Freighter LX',
    status: 'in-flight',
    cargoCapacity: 540,
    crewCapacity: 18,
    lastKnownSector: 'Pulsar Corridor',
  },
  {
    id: 'glass-comet',
    name: 'Glass Comet',
    model: 'Scout V',
    status: 'maintenance',
    cargoCapacity: 180,
    crewCapacity: 8,
    lastKnownSector: 'Silent Array',
  },
]

const DEMO_INVENTORY: ResourceInventory = {
  credits: 4200,
  fuel: 260,
  minerals: 180,
  nebulaDust: 90,
}

const RESOURCE_ORDER: ResourceType[] = ['credits', 'fuel', 'minerals', 'nebulaDust']

function hasResources(inventory: ResourceInventory, cost: Partial<Record<ResourceType, number>>): boolean {
  return RESOURCE_ORDER.every((resource) => (cost[resource] ?? 0) <= inventory[resource])
}

function ShipCard({
  ship,
  active,
  onSelect,
}: {
  ship: Ship
  active: boolean
  onSelect: (shipId: string) => void
}) {
  return (
    <button
      type="button"
      className={active ? 'ship-card is-active' : 'ship-card'}
      onClick={() => onSelect(ship.id)}
    >
      <div className="ship-card-top">
        <div>
          <p className="ship-name">{ship.name}</p>
          <span className="ship-model">{ship.model}</span>
        </div>
        <span className={`status-pill status-${ship.status}`}>{ship.status}</span>
      </div>

      <dl className="ship-stats">
        <div>
          <dt>Cargo</dt>
          <dd>{ship.cargoCapacity}</dd>
        </div>
        <div>
          <dt>Crew</dt>
          <dd>{ship.crewCapacity}</dd>
        </div>
        <div>
          <dt>Sector</dt>
          <dd>{ship.lastKnownSector ?? 'Unknown'}</dd>
        </div>
      </dl>
    </button>
  )
}

function ShipDashboard() {
  const { ships, activeShipId, setShips, setActiveShip, upsertShip } = useShipStore()
  const { inventory, setInventory, adjustResource } = useResourceStore()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const seededShips = useRef(false)
  const seededInventory = useRef(false)

  useEffect(() => {
    if (!seededShips.current && ships.length === 0) {
      setShips(DEMO_SHIPS)
      seededShips.current = true
    }
  }, [setShips, ships.length])

  useEffect(() => {
    if (!seededInventory.current && Object.values(inventory).every((amount) => amount === 0)) {
      setInventory(DEMO_INVENTORY)
      seededInventory.current = true
    }
  }, [inventory, setInventory])

  const fleet = ships.length > 0 ? ships : DEMO_SHIPS

  useEffect(() => {
    if (!activeShipId && fleet.length > 0) {
      setActiveShip(fleet[0].id)
    }
  }, [activeShipId, fleet, setActiveShip])

  const activeShip = useMemo(
    () => fleet.find((ship) => ship.id === activeShipId) ?? fleet[0] ?? null,
    [activeShipId, fleet]
  )

  const totalCargoCapacity = useMemo(
    () => fleet.reduce((sum, ship) => sum + ship.cargoCapacity, 0),
    [fleet]
  )

  const totalCrewCapacity = useMemo(
    () => fleet.reduce((sum, ship) => sum + ship.crewCapacity, 0),
    [fleet]
  )

  const dockedShips = useMemo(
    () => fleet.filter((ship) => ship.status === 'docked').length,
    [fleet]
  )

  const availableUpgrades = useMemo(
    () => SHIP_UPGRADES.filter((upgrade) => hasResources(inventory, upgrade.cost)).length,
    [inventory]
  )

  const handleApplyUpgrade = (upgrade: ShipUpgradeOption) => {
    if (!activeShip || !hasResources(inventory, upgrade.cost)) return

    for (const [resource, amount] of Object.entries(upgrade.cost)) {
      if (!amount) continue
      adjustResource(resource as ResourceType, -amount)
    }

    upsertShip({
      ...activeShip,
      cargoCapacity: activeShip.cargoCapacity + (upgrade.cargoDelta ?? 0),
      crewCapacity: activeShip.crewCapacity + (upgrade.crewDelta ?? 0),
      status: upgrade.statusAfter ?? 'docked',
      lastKnownSector: upgrade.sectorLabel ?? activeShip.lastKnownSector,
    })

    setIsUpgradeOpen(false)
  }

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">Ship Dashboard</p>
          <h1>Fleet command, inventory, and upgrades in one place.</h1>
          <p className="page-copy">
            Monitor live ship state from the local fleet store, review resource
            reserves, and stage ordered upgrade batches without leaving the dashboard.
          </p>
        </div>

        <div className="dashboard-actions">
          <button type="button" className="primary-button" onClick={() => setIsUpgradeOpen(true)}>
            Open upgrade bay
          </button>
          <span className="dashboard-hint">{availableUpgrades} upgrades currently affordable</span>
        </div>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-label">Fleet size</span>
          <strong>{fleet.length}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Docked ships</span>
          <strong>{dockedShips}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Cargo capacity</span>
          <strong>{totalCargoCapacity}</strong>
        </article>
        <article className="metric-card">
          <span className="metric-label">Crew capacity</span>
          <strong>{totalCrewCapacity}</strong>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fleet</p>
              <h2>Tracked ships</h2>
            </div>
            <span className="section-meta">{activeShip ? `Selected: ${activeShip.name}` : 'No active ship'}</span>
          </div>

          <div className="ship-list">
            {fleet.map((ship) => (
              <ShipCard
                key={ship.id}
                ship={ship}
                active={ship.id === activeShip?.id}
                onSelect={(shipId) => setActiveShip(shipId)}
              />
            ))}
          </div>
        </section>

        <div className="dashboard-column">
          <Inventory inventory={inventory} />

          <section className="panel-card panel-card-tight">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Upgrade Queue</p>
                <h2>Ready for batch execution</h2>
              </div>
            </div>

            <div className="queue-list">
              {SHIP_UPGRADES.map((upgrade) => (
                <div key={upgrade.id} className="queue-item">
                  <div>
                    <strong>{upgrade.name}</strong>
                    <p>{upgrade.description}</p>
                  </div>
                  <span>{hasResources(inventory, upgrade.cost) ? 'Ready' : 'Locked'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeOpen}
        ship={activeShip}
        inventory={inventory}
        onClose={() => setIsUpgradeOpen(false)}
        onConfirm={handleApplyUpgrade}
      />
    </section>
  )
}

export default ShipDashboard
