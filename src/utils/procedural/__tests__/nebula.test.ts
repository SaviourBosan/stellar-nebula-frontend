import { describe, it, expect } from 'vitest'
import {
  createRNG,
  createPermutation,
  hashToSeed,
  subSeed,
  fbm2D,
  fbm3D,
  generateNebula,
  generateNebulaGeometry,
} from '../nebula'

// ─── Seeded RNG ────────────────────────────────────────────────────────────

describe('createRNG', () => {
  it('produces deterministic output for the same seed', () => {
    const rng1 = createRNG(42)
    const rng2 = createRNG(42)
    const seq1 = Array.from({ length: 100 }, () => rng1())
    const seq2 = Array.from({ length: 100 }, () => rng2())
    expect(seq1).toEqual(seq2)
  })

  it('produces different output for different seeds', () => {
    const rng1 = createRNG(42)
    const rng2 = createRNG(999)
    const seq1 = Array.from({ length: 50 }, () => rng1())
    const seq2 = Array.from({ length: 50 }, () => rng2())
    expect(seq1).not.toEqual(seq2)
  })

  it('returns values in the [0, 1) range', () => {
    const rng = createRNG(12345)
    for (let i = 0; i < 10000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('returns floats, not integers', () => {
    const rng = createRNG(77)
    const values = Array.from({ length: 100 }, () => rng())
    const allIntegers = values.every((v) => v === Math.floor(v))
    expect(allIntegers).toBe(false)
  })

  it('handles zero seed', () => {
    const rng = createRNG(0)
    expect(rng()).toBeGreaterThanOrEqual(0)
    expect(rng()).toBeGreaterThanOrEqual(0)
  })

  it('handles negative seeds', () => {
    const rng = createRNG(-100)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('handles very large seeds', () => {
    const rng = createRNG(0xffffffff)
    for (let i = 0; i < 50; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
    }
  })

  it('produces statistically uniform-ish distribution', () => {
    const rng = createRNG(555)
    const buckets = new Array(10).fill(0)
    const samples = 10000
    for (let i = 0; i < samples; i++) {
      const v = rng()
      const bucket = Math.min(9, Math.floor(v * 10))
      buckets[bucket]++
    }
    const expected = samples / 10
    for (const count of buckets) {
      expect(count).toBeGreaterThan(expected * 0.7)
      expect(count).toBeLessThan(expected * 1.3)
    }
  })
})

// ─── Hash to seed ──────────────────────────────────────────────────────────

describe('hashToSeed', () => {
  it('returns a positive integer', () => {
    const seed = hashToSeed('abc123def456')
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
  })

  it('produces consistent results for the same hash', () => {
    expect(hashToSeed('hello')).toBe(hashToSeed('hello'))
  })

  it('produces different seeds for different hashes', () => {
    const seed1 = hashToSeed('aaaa')
    const seed2 = hashToSeed('bbbb')
    expect(seed1).not.toBe(seed2)
  })

  it('handles empty string', () => {
    const seed = hashToSeed('')
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBe(0)
  })

  it('handles valid Stellar transaction hash format', () => {
    const hash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'
    const seed = hashToSeed(hash)
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
  })

  it('handles non-hex characters gracefully', () => {
    const seed = hashToSeed('xyz!!!')
    expect(Number.isInteger(seed)).toBe(true)
    expect(seed).toBeGreaterThanOrEqual(0)
  })
})

// ─── Sub-seed ──────────────────────────────────────────────────────────────

describe('subSeed', () => {
  it('returns a positive integer', () => {
    const rng = createRNG(42)
    const s = subSeed(rng)
    expect(Number.isInteger(s)).toBe(true)
    expect(s).toBeGreaterThanOrEqual(0)
  })

  it('advances the parent RNG', () => {
    const rng = createRNG(42)
    const clone = createRNG(42)
    subSeed(rng)
    expect(rng()).not.toBe(clone())
  })

  it('produces different sub-seeds from different RNG states', () => {
    const rng1 = createRNG(100)
    const rng2 = createRNG(200)
    expect(subSeed(rng1)).not.toBe(subSeed(rng2))
  })
})

// ─── Perlin noise ──────────────────────────────────────────────────────────

describe('fbm2D', () => {
  it('returns a value between -1 and 1', () => {
    const perm = createPermutation(42)
    for (let i = 0; i < 100; i++) {
      const v = fbm2D(i * 0.1, i * 0.1, 4, perm)
      expect(v).toBeGreaterThanOrEqual(-1)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic with the same permutation', () => {
    const perm = createPermutation(42)
    const result1 = fbm2D(1.5, 2.5, 4, perm)
    const result2 = fbm2D(1.5, 2.5, 4, perm)
    expect(result1).toBe(result2)
  })
})

describe('fbm3D', () => {
  it('returns a value between -1 and 1', () => {
    const perm = createPermutation(42)
    for (let i = 0; i < 100; i++) {
      const v = fbm3D(i * 0.1, i * 0.1, i * 0.1, 4, perm)
      expect(v).toBeGreaterThanOrEqual(-1)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is deterministic with the same permutation', () => {
    const perm = createPermutation(42)
    const result1 = fbm3D(1.5, 2.5, 3.5, 4, perm)
    const result2 = fbm3D(1.5, 2.5, 3.5, 4, perm)
    expect(result1).toBe(result2)
  })
})

// ─── Nebula generation ─────────────────────────────────────────────────────

const SAMPLE_HASH = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2'

describe('generateNebulaGeometry', () => {
  it('returns geometry with correct structure', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, particleCount: 2000 })
    expect(geom.positions).toBeInstanceOf(Float32Array)
    expect(geom.colors).toBeInstanceOf(Float32Array)
    expect(geom.sizes).toBeInstanceOf(Float32Array)
    expect(geom.opacities).toBeInstanceOf(Float32Array)
    expect(geom.positions.length).toBe(2000 * 3)
    expect(geom.colors.length).toBe(2000 * 3)
    expect(geom.sizes.length).toBe(2000)
    expect(geom.opacities.length).toBe(2000)
  })

  it('uses default particle count when not specified', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH })
    expect(geom.sizes.length).toBe(20000)
  })

  it('respects custom particle count', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, particleCount: 500 })
    expect(geom.sizes.length).toBe(1000) // clamped to MIN
  })

  it('clamps particle count to maximum', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, particleCount: 999999 })
    expect(geom.sizes.length).toBe(100000)
  })

  it('produces deterministic output for the same seed', () => {
    const geom1 = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      pattern: 'spiral',
      particleCount: 500,
    })
    const geom2 = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      pattern: 'spiral',
      particleCount: 500,
    })
    expect(geom1.positions).toEqual(geom2.positions)
    expect(geom1.colors).toEqual(geom2.colors)
    expect(geom1.sizes).toEqual(geom2.sizes)
    expect(geom1.opacities).toEqual(geom2.opacities)
  })

  it('produces different output for different seeds', () => {
    const geom1 = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      pattern: 'spiral',
      particleCount: 200,
    })
    const geom2 = generateNebulaGeometry({
      seed: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      pattern: 'spiral',
      particleCount: 200,
    })
    // At least one array should differ
    const diff =
      !arraysEqual(geom1.positions, geom2.positions) || !arraysEqual(geom1.sizes, geom2.sizes)
    expect(diff).toBe(true)
  })

  it('all colors are in [0, 1] range', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, particleCount: 2000 })
    for (let i = 0; i < geom.colors.length; i++) {
      expect(geom.colors[i]).toBeGreaterThanOrEqual(0)
      expect(geom.colors[i]).toBeLessThanOrEqual(1)
    }
  })

  it('all opacities are in [0, 1] range', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, particleCount: 2000 })
    for (let i = 0; i < geom.opacities.length; i++) {
      expect(geom.opacities[i]).toBeGreaterThanOrEqual(0)
      expect(geom.opacities[i]).toBeLessThanOrEqual(1)
    }
  })

  it('all sizes are positive', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, particleCount: 2000 })
    for (let i = 0; i < geom.sizes.length; i++) {
      expect(geom.sizes[i]).toBeGreaterThan(0)
    }
  })

  it('generates spiral pattern without error', () => {
    const geom = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      pattern: 'spiral',
      particleCount: 2000,
    })
    expect(geom.positions.length).toBe(6000)
  })

  it('generates ring pattern without error', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, pattern: 'ring', particleCount: 2000 })
    expect(geom.positions.length).toBe(6000)
  })

  it('generates cluster pattern without error', () => {
    const geom = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      pattern: 'cluster',
      particleCount: 2000,
    })
    expect(geom.positions.length).toBe(6000)
  })

  it('generates filament pattern without error', () => {
    const geom = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      pattern: 'filament',
      particleCount: 2000,
    })
    expect(geom.positions.length).toBe(6000)
  })

  it('generates core pattern without error', () => {
    const geom = generateNebulaGeometry({ seed: SAMPLE_HASH, pattern: 'core', particleCount: 2000 })
    expect(geom.positions.length).toBe(6000)
  })

  it('accepts custom color palette', () => {
    const customPalette: ReadonlyArray<readonly [number, number, number]> = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
    const geom = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      colorPalette: customPalette,
      particleCount: 2000,
    })
    expect(geom.colors.length).toBe(6000)
    for (let i = 0; i < geom.colors.length; i++) {
      expect(geom.colors[i]).toBeGreaterThanOrEqual(0)
      expect(geom.colors[i]).toBeLessThanOrEqual(1)
    }
  })

  it('accepts custom radius', () => {
    const geom = generateNebulaGeometry({
      seed: SAMPLE_HASH,
      radius: 10,
      particleCount: 2000,
    })
    const maxDist = maxPositionDistance(geom.positions)
    expect(maxDist).toBeLessThan(45)
  })
})

describe('generateNebula', () => {
  it('returns the correct number of particles', () => {
    const particles = generateNebula({ seed: SAMPLE_HASH, particleCount: 2000 })
    expect(particles.length).toBe(2000)
  })

  it('returns particles with correct structure', () => {
    const particles = generateNebula({ seed: SAMPLE_HASH, particleCount: 5000 })
    expect(particles.length).toBe(5000)
    const p = particles[0]
    expect(p.position).toHaveLength(3)
    expect(p.color).toHaveLength(3)
    expect(typeof p.size).toBe('number')
    expect(typeof p.opacity).toBe('number')
  })

  it('is deterministic with the same config', () => {
    const p1 = generateNebula({ seed: SAMPLE_HASH, pattern: 'core', particleCount: 300 })
    const p2 = generateNebula({ seed: SAMPLE_HASH, pattern: 'core', particleCount: 300 })
    expect(p1).toEqual(p2)
  })

  it('different seeds produce different particles', () => {
    const p1 = generateNebula({ seed: SAMPLE_HASH, pattern: 'spiral', particleCount: 200 })
    const p2 = generateNebula({
      seed: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      pattern: 'spiral',
      particleCount: 200,
    })
    expect(p1).not.toEqual(p2)
  })

  it('different patterns produce different particles', () => {
    const p1 = generateNebula({ seed: SAMPLE_HASH, pattern: 'spiral', particleCount: 300 })
    const p2 = generateNebula({ seed: SAMPLE_HASH, pattern: 'ring', particleCount: 300 })
    expect(p1).not.toEqual(p2)
  })
})

// ─── Helpers ───────────────────────────────────────────────────────────────

function arraysEqual(a: Float32Array | number[], b: Float32Array | number[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function maxPositionDistance(positions: Float32Array): number {
  let maxDist = 0
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]
    const y = positions[i + 1]
    const z = positions[i + 2]
    const dist = Math.sqrt(x * x + y * y + z * z)
    if (dist > maxDist) maxDist = dist
  }
  return maxDist
}
