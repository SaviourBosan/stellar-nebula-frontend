/**
 * Game mechanics constants for Stellar Nebula.
 * Centralises all magic numbers so they're easy to tune.
 */

// ─── Ship ────────────────────────────────────────────────────────────────────

/** Base movement speed (units / second) */
export const SHIP_BASE_SPEED = 5

/** Maximum boost multiplier applied on top of base speed */
export const SHIP_MAX_BOOST = 3

/** Shield regeneration rate (points / second) */
export const SHIP_SHIELD_REGEN_RATE = 2

/** Maximum shield points */
export const SHIP_MAX_SHIELD = 100

/** Maximum hull integrity points */
export const SHIP_MAX_HULL = 200

// ─── Resources ───────────────────────────────────────────────────────────────

/** Base cost to mine one unit of Nebulite */
export const RESOURCE_MINE_COST = 10

/** Base sell price for one unit of Nebulite */
export const RESOURCE_SELL_PRICE = 25

/** Maximum cargo capacity (units) */
export const CARGO_MAX_CAPACITY = 500

// ─── Nebula ───────────────────────────────────────────────────────────────────

/** Radius of a standard nebula zone (world units) */
export const NEBULA_ZONE_RADIUS = 50

/** Density multiplier for particle effects inside a nebula */
export const NEBULA_PARTICLE_DENSITY = 0.8

/** Visibility reduction factor inside a nebula (0–1) */
export const NEBULA_VISIBILITY_FACTOR = 0.4

// ─── Economy ─────────────────────────────────────────────────────────────────

/** Starting credits for a new player */
export const ECONOMY_STARTING_CREDITS = 1000

/** Transaction fee percentage (0–1) */
export const ECONOMY_TX_FEE = 0.01

/** Maximum credits a player can hold */
export const ECONOMY_MAX_CREDITS = 1_000_000
