// ─── Types ─────────────────────────────────────────────────────────────────────

/** Available nebula pattern types */
export type NebulaPattern = 'spiral' | 'ring' | 'cluster' | 'filament' | 'core'

/** Color represented as an RGB tuple with values in the 0..1 range */
export type NebulaColor = readonly [number, number, number]

/** Configuration for nebula generation */
export interface NebulaConfig {
  /** Stellar transaction hash used as a deterministic seed */
  seed: string
  /** Nebula pattern type. Defaults to a pattern derived from the seed. */
  pattern?: NebulaPattern
  /** Number of particles to generate (default: 20 000, clamped 1 000 – 100 000) */
  particleCount?: number
  /** Maximum radius of the nebula (default: 70) */
  radius?: number
  /** Color palette for particle coloring (default: built-in nebula palette) */
  colorPalette?: ReadonlyArray<NebulaColor>
}

/** A single nebula particle */
export interface NebulaParticle {
  position: readonly [number, number, number]
  color: readonly [number, number, number]
  size: number
  opacity: number
}

/** Geometry data ready for Three.js BufferGeometry */
export interface NebulaGeometry {
  positions: Float32Array
  colors: Float32Array
  sizes: Float32Array
  opacities: Float32Array
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PALETTE: ReadonlyArray<NebulaColor> = [
  [0.992, 0.957, 1.0],
  [0.941, 0.671, 0.988],
  [0.753, 0.518, 0.988],
  [0.655, 0.545, 0.98],
  [0.506, 0.549, 0.973],
  [0.376, 0.647, 0.98],
  [0.22, 0.741, 0.973],
  [0.133, 0.827, 0.929],
]

const PATTERN_LIST: readonly NebulaPattern[] = ['spiral', 'ring', 'cluster', 'filament', 'core']

const DEFAULT_PARTICLE_COUNT = 20000
const MIN_PARTICLE_COUNT = 1000
const MAX_PARTICLE_COUNT = 100000
const DEFAULT_RADIUS = 70

// ─── Seeded PRNG ──────────────────────────────────────────────────────────────

/**
 * Creates a deterministic pseudo-random number generator using the mulberry32
 * algorithm. Returns a function that produces values in the [0, 1) range.
 */
export function createRNG(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Hash utilities ───────────────────────────────────────────────────────────

/**
 * Converts a Stellar transaction hash (hex string) into a numeric seed suitable
 * for the RNG. Splits the hash into 8-character chunks, XOR-folds them, and
 * applies a mixing step for good bit distribution.
 */
export function hashToSeed(hash: string): number {
  let seed = 0
  for (let i = 0; i < hash.length; i += 8) {
    const chunk = hash.slice(i, i + 8)
    const val = parseInt(chunk, 16) || 0
    seed = ((seed ^ val) * 0x6d2b79f5) | 0
  }
  return seed >>> 0
}

/**
 * Derives a sub-seed from an existing RNG for independent sub-generators.
 * Advances the parent RNG and hashes its output into a new 32-bit integer.
 */
export function subSeed(rng: () => number): number {
  const a = (rng() * 0xffffffff) >>> 0
  const b = (rng() * 0xffffffff) >>> 0
  return ((a ^ (b << 13)) * 0x6d2b79f5) >>> 0
}

// ─── Perlin noise ─────────────────────────────────────────────────────────────

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

function grad2D(hash: number, x: number, y: number): number {
  const h = hash & 7
  const u = h < 4 ? x : y
  const v = h < 4 ? y : x
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

function grad3D(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

export function createPermutation(seed: number): Uint8Array {
  const perm = new Uint8Array(512)
  for (let i = 0; i < 256; i++) {
    perm[i] = i
  }
  const rng = createRNG(seed)
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0
    const tmp = perm[i]
    perm[i] = perm[j]
    perm[j] = tmp
  }
  for (let i = 0; i < 256; i++) {
    perm[i + 256] = perm[i]
  }
  return perm
}

function noise2D(x: number, y: number, perm: Uint8Array): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255

  x -= Math.floor(x)
  y -= Math.floor(y)

  const u = fade(x)
  const v = fade(y)

  const a = perm[X] + Y
  const b = perm[X + 1] + Y

  return lerp(
    v,
    lerp(u, grad2D(perm[a], x, y), grad2D(perm[b], x - 1, y)),
    lerp(u, grad2D(perm[a + 1], x, y - 1), grad2D(perm[b + 1], x - 1, y - 1))
  )
}

function noise3D(x: number, y: number, z: number, perm: Uint8Array): number {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255

  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)

  const u = fade(x)
  const v = fade(y)
  const w = fade(z)

  const A = perm[X] + Y
  const AA = perm[A] + Z
  const AB = perm[A + 1] + Z
  const B = perm[X + 1] + Y
  const BA = perm[B] + Z
  const BB = perm[B + 1] + Z

  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad3D(perm[AA], x, y, z), grad3D(perm[BA], x - 1, y, z)),
      lerp(u, grad3D(perm[AB], x, y - 1, z), grad3D(perm[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad3D(perm[AA + 1], x, y, z - 1), grad3D(perm[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad3D(perm[AB + 1], x, y - 1, z - 1), grad3D(perm[BB + 1], x - 1, y - 1, z - 1))
    )
  )
}

/**
 * Fractal Brownian Motion in 2D. Stacks multiple octaves of noise with
 * decreasing amplitude and increasing frequency for richer detail.
 */
export function fbm2D(x: number, y: number, octaves: number, perm: Uint8Array): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency, perm)
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  const raw = value / maxValue
  return raw > 1 ? 1 : raw < -1 ? -1 : raw
}

/**
 * Fractal Brownian Motion in 3D. Stacks multiple octaves of noise with
 * decreasing amplitude and increasing frequency for richer detail.
 */
export function fbm3D(x: number, y: number, z: number, octaves: number, perm: Uint8Array): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency, perm)
    maxValue += amplitude
    amplitude *= 0.5
    frequency *= 2
  }

  const raw = value / maxValue
  return raw > 1 ? 1 : raw < -1 ? -1 : raw
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function lerpColor(a: NebulaColor, b: NebulaColor, t: number): NebulaColor {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

function samplePalette(t: number, palette: ReadonlyArray<NebulaColor>): NebulaColor {
  const clamped = Math.max(0, Math.min(1, t))
  const idx = clamped * (palette.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.min(lo + 1, palette.length - 1)
  const frac = idx - lo
  return lerpColor(palette[lo], palette[hi], frac)
}

// ─── Pattern generators ───────────────────────────────────────────────────────

function generateSpiral(
  rng: () => number,
  perm: Uint8Array,
  count: number,
  radius: number,
  palette: ReadonlyArray<NebulaColor>
): NebulaGeometry {
  const arms = (3 + rng() * 3) | 0
  const twist = 2.5 + rng() * 4
  const armSpread = 0.18 + rng() * 0.28

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const t = (i / count) ** 0.7
    const dist = t * radius
    const armIndex = i % arms
    const baseAngle = (armIndex / arms) * Math.PI * 2
    const noiseVal = fbm3D(
      Math.cos(baseAngle + t) * 2.5,
      Math.sin(baseAngle + t) * 2.5,
      t * 3.5,
      4,
      perm
    )
    const angle = baseAngle + t * twist * Math.PI + noiseVal * armSpread
    const radialOffset = noiseVal * 9

    const x = Math.cos(angle) * (dist + radialOffset)
    const z = Math.sin(angle) * (dist + radialOffset)
    const y = fbm3D(t * 2.2, angle * 2.8, 0.5, 3, perm) * 12 * (1 - t * 0.7)

    const pi = i * 3
    positions[pi] = x
    positions[pi + 1] = y
    positions[pi + 2] = z

    const colorT = t * 0.6 + rng() * 0.08
    const color = samplePalette(colorT, palette)
    colors[pi] = color[0]
    colors[pi + 1] = color[1]
    colors[pi + 2] = color[2]

    sizes[i] = 0.6 + rng() * 5.5 * (1 - t * 0.5)
    opacities[i] = 0.15 + (1 - t) * 0.7 + noiseVal * 0.15
  }

  return { positions, colors, sizes, opacities }
}

function generateRing(
  rng: () => number,
  perm: Uint8Array,
  count: number,
  radius: number,
  palette: ReadonlyArray<NebulaColor>
): NebulaGeometry {
  const ringCount = (3 + rng() * 4) | 0

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)

  const rings = new Float32Array(ringCount * 3)
  for (let r = 0; r < ringCount; r++) {
    const t = (r + 1) / (ringCount + 1)
    rings[r * 3] = 8 + t * (radius * 0.9 - 8)
    rings[r * 3 + 1] = 2 + rng() * 6
    rings[r * 3 + 2] = 0.5 + rng() * 2.5
  }

  for (let i = 0; i < count; i++) {
    const ri = (i % ringCount) * 3
    const ringRadius = rings[ri]
    const ringWidth = rings[ri + 1]
    const waveScale = rings[ri + 2]

    const angle =
      (i / count) * Math.PI * 2 * ((ringCount * 3 + rng() * 20) | 0) + rng() * Math.PI * 2

    const nx = Math.cos(angle) * waveScale
    const nz = Math.sin(angle) * waveScale
    const wave = fbm3D(nx, nz, 0, 3, perm) * ringWidth

    const effectiveRadius = ringRadius + wave
    const x = Math.cos(angle) * effectiveRadius
    const z = Math.sin(angle) * effectiveRadius
    const y = fbm3D(x * 0.08, z * 0.08, angle * 0.5, 3, perm) * 8

    const pi = i * 3
    positions[pi] = x
    positions[pi + 1] = y
    positions[pi + 2] = z

    const t = Math.abs(wave) / ringWidth
    const colorT = 0.1 + t * 0.5 + rng() * 0.06
    const color = samplePalette(colorT, palette)
    colors[pi] = color[0]
    colors[pi + 1] = color[1]
    colors[pi + 2] = color[2]

    sizes[i] = 0.8 + rng() * 4.5
    opacities[i] = 0.2 + rng() * 0.55
  }

  return { positions, colors, sizes, opacities }
}

function generateCluster(
  rng: () => number,
  perm: Uint8Array,
  count: number,
  radius: number,
  palette: ReadonlyArray<NebulaColor>
): NebulaGeometry {
  const clusterCount = (3 + rng() * 5) | 0

  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)

  const clusterCenters = new Float32Array(clusterCount * 3)
  const clusterRadii = new Float32Array(clusterCount)
  for (let c = 0; c < clusterCount; c++) {
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const r = radius * (0.2 + rng() * 0.7)
    clusterCenters[c * 3] = r * Math.sin(phi) * Math.cos(theta)
    clusterCenters[c * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6
    clusterCenters[c * 3 + 2] = r * Math.cos(phi)
    clusterRadii[c] = 4 + rng() * 16
  }

  for (let i = 0; i < count; i++) {
    const ci = (i % clusterCount) * 3
    const cx = clusterCenters[ci]
    const cy = clusterCenters[ci + 1]
    const cz = clusterCenters[ci + 2]
    const cr = clusterRadii[Math.floor(ci / 3)]

    const falloff = 1 - Math.exp(-rng() * 3)
    const d = falloff * cr

    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const x = cx + d * Math.sin(phi) * Math.cos(theta)
    const y = cy + d * Math.sin(phi) * Math.sin(theta) * 0.5
    const z = cz + d * Math.cos(phi)

    const noiseShift = fbm3D(x * 0.1, y * 0.1, z * 0.1, 3, perm) * 4
    const pi = i * 3
    positions[pi] = x + noiseShift * 0.5
    positions[pi + 1] = y + noiseShift * 0.3
    positions[pi + 2] = z + noiseShift * 0.5

    const t = d / cr
    const colorT = t * 0.55 + rng() * 0.06
    const color = samplePalette(colorT, palette)
    colors[pi] = color[0]
    colors[pi + 1] = color[1]
    colors[pi + 2] = color[2]

    sizes[i] = 0.5 + rng() * 5 * (1 - t * 0.6)
    opacities[i] = 0.2 + (1 - t) * 0.55 + rng() * 0.15
  }

  return { positions, colors, sizes, opacities }
}

function generateFilament(
  rng: () => number,
  perm: Uint8Array,
  count: number,
  radius: number,
  palette: ReadonlyArray<NebulaColor>
): NebulaGeometry {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)
    const r = radius * (0.05 + rng() * 0.95)

    let x = r * Math.sin(phi) * Math.cos(theta)
    let y = r * Math.sin(phi) * Math.sin(theta) * 0.5
    let z = r * Math.cos(phi)

    const n = fbm3D(x * 0.06, y * 0.06, z * 0.06, 4, perm)
    const ridge = 1 - Math.abs(n) * 2

    x += n * 15
    y += fbm3D(z * 0.06, x * 0.06, y * 0.06, 3, perm) * 10
    z += fbm3D(y * 0.06, z * 0.06, x * 0.06, 3, perm) * 15

    const pi = i * 3
    positions[pi] = x
    positions[pi + 1] = y
    positions[pi + 2] = z

    const colorT = ridge * 0.5 + rng() * 0.08
    const color = samplePalette(colorT, palette)
    colors[pi] = color[0]
    colors[pi + 1] = color[1]
    colors[pi + 2] = color[2]

    sizes[i] = 0.4 + ridge * 4 + rng() * 2
    opacities[i] = 0.12 + ridge * 0.55 + rng() * 0.2
  }

  return { positions, colors, sizes, opacities }
}

function generateCore(
  rng: () => number,
  perm: Uint8Array,
  count: number,
  radius: number,
  palette: ReadonlyArray<NebulaColor>
): NebulaGeometry {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const opacities = new Float32Array(count)

  const coreRadius = radius * 0.2 + rng() * radius * 0.1

  for (let i = 0; i < count; i++) {
    const t = (i / count) ** 0.5
    const theta = rng() * Math.PI * 2
    const phi = Math.acos(2 * rng() - 1)

    let dist: number
    if (t < 0.15) {
      dist = coreRadius * (t / 0.15)
    } else {
      dist = coreRadius + ((t - 0.15) * (radius - coreRadius)) / 0.85
    }

    const noiseR = fbm3D(
      Math.cos(theta) * dist * 0.04,
      Math.sin(theta) * dist * 0.04,
      Math.cos(phi) * dist * 0.04,
      4,
      perm
    )
    dist += noiseR * 10

    const x = dist * Math.sin(phi) * Math.cos(theta)
    const y = dist * Math.sin(phi) * Math.sin(theta) * 0.5 + noiseR * 6
    const z = dist * Math.cos(phi)

    const pi = i * 3
    positions[pi] = x
    positions[pi + 1] = y
    positions[pi + 2] = z

    const colorT = Math.min(1, dist / radius) * 0.65 + rng() * 0.05
    const color = samplePalette(colorT, palette)
    colors[pi] = color[0]
    colors[pi + 1] = color[1]
    colors[pi + 2] = color[2]

    const coreFactor = Math.max(0, 1 - dist / coreRadius)
    sizes[i] = 0.5 + rng() * 3 + coreFactor * 3
    opacities[i] = 0.15 + Math.max(0, 1 - dist / radius) * 0.7 + coreFactor * 0.15
  }

  return { positions, colors, sizes, opacities }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates nebula geometry data from a Stellar transaction hash seed.
 * Produces deterministic, visually distinct patterns using Perlin noise.
 */
export function generateNebulaGeometry(config: NebulaConfig): NebulaGeometry {
  const seed = hashToSeed(config.seed)
  const rng = createRNG(seed)
  const noiseSeed = subSeed(rng)
  const perm = createPermutation(noiseSeed)

  const pattern = config.pattern ?? PATTERN_LIST[(rng() * PATTERN_LIST.length) | 0]

  const count = Math.max(
    MIN_PARTICLE_COUNT,
    Math.min(MAX_PARTICLE_COUNT, config.particleCount ?? DEFAULT_PARTICLE_COUNT)
  )
  const radius = config.radius ?? DEFAULT_RADIUS
  const palette = config.colorPalette ?? DEFAULT_PALETTE

  switch (pattern) {
    case 'spiral':
      return generateSpiral(rng, perm, count, radius, palette)
    case 'ring':
      return generateRing(rng, perm, count, radius, palette)
    case 'cluster':
      return generateCluster(rng, perm, count, radius, palette)
    case 'filament':
      return generateFilament(rng, perm, count, radius, palette)
    case 'core':
      return generateCore(rng, perm, count, radius, palette)
  }
}

/**
 * Generates nebula particles from a Stellar transaction hash seed.
 * Returns an array of {@link NebulaParticle} objects for easy inspection
 * and serialization.
 */
export function generateNebula(config: NebulaConfig): NebulaParticle[] {
  const geom = generateNebulaGeometry(config)
  const len = (geom.positions.length / 3) | 0
  const particles: NebulaParticle[] = new Array(len)

  for (let i = 0; i < len; i++) {
    const pi = i * 3
    particles[i] = {
      position: [geom.positions[pi], geom.positions[pi + 1], geom.positions[pi + 2]],
      color: [geom.colors[pi], geom.colors[pi + 1], geom.colors[pi + 2]],
      size: geom.sizes[i],
      opacity: geom.opacities[i],
    }
  }

  return particles
}
