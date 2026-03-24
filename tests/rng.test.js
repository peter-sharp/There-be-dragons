/**
 * tests/rng.test.js
 *
 * Tests for makeRng (mulberry32 PRNG) and seededShuffle.
 * These are pure functions with no side effects, so tests are fast and simple.
 */

import { expect } from 'chai'
import { makeRng, seededShuffle } from '../src/store.js'

// ── makeRng ───────────────────────────────────────────────

describe('makeRng', () => {
  it('returns a function', () => {
    const rng = makeRng(42)
    expect(rng).to.be.a('function')
  })

  it('produces values in [0, 1)', () => {
    const rng = makeRng(12345)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).to.be.at.least(0)
      expect(v).to.be.below(1)
    }
  })

  it('same seed → same sequence', () => {
    const rng1 = makeRng(99)
    const rng2 = makeRng(99)
    for (let i = 0; i < 20; i++) {
      expect(rng1()).to.equal(rng2())
    }
  })

  it('different seeds → different first values', () => {
    const v1 = makeRng(1)()
    const v2 = makeRng(2)()
    expect(v1).to.not.equal(v2)
  })

  it('advances state on each call (not idempotent)', () => {
    const rng = makeRng(7777)
    const a = rng()
    const b = rng()
    expect(a).to.not.equal(b)
  })

  it('seed 0 produces valid output (no divide-by-zero)', () => {
    const rng = makeRng(0)
    const v = rng()
    expect(v).to.be.at.least(0)
    expect(v).to.be.below(1)
    expect(Number.isNaN(v)).to.be.false
  })

  it('large seed produces valid output', () => {
    const rng = makeRng(2 ** 31 - 1)
    const v = rng()
    expect(v).to.be.at.least(0)
    expect(v).to.be.below(1)
  })

  it('produces floats, not integers', () => {
    const rng = makeRng(54321)
    // Over 20 calls, at least some should have fractional part
    const values = Array.from({ length: 20 }, () => rng())
    const hasFractional = values.some(v => v !== Math.floor(v))
    expect(hasFractional).to.be.true
  })
})

// ── seededShuffle ─────────────────────────────────────────

describe('seededShuffle', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3, 4, 5]
    const out = seededShuffle(arr, makeRng(1))
    expect(out).to.have.length(arr.length)
  })

  it('does not mutate the input array', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    seededShuffle(arr, makeRng(1))
    expect(arr).to.deep.equal(copy)
  })

  it('contains all original elements', () => {
    const arr = ['a', 'b', 'c', 'd', 'e']
    const out = seededShuffle(arr, makeRng(42))
    expect(out.sort()).to.deep.equal([...arr].sort())
  })

  it('same seed + same input → same output', () => {
    const arr = [1, 2, 3, 4, 5]
    const out1 = seededShuffle(arr, makeRng(100))
    const out2 = seededShuffle(arr, makeRng(100))
    expect(out1).to.deep.equal(out2)
  })

  it('different seeds → different outputs (with high probability)', () => {
    // Use a long array to make collision extremely unlikely
    const arr = Array.from({ length: 20 }, (_, i) => i)
    const out1 = seededShuffle(arr, makeRng(1))
    const out2 = seededShuffle(arr, makeRng(999))
    expect(out1).to.not.deep.equal(out2)
  })

  it('handles empty array', () => {
    const out = seededShuffle([], makeRng(1))
    expect(out).to.deep.equal([])
  })

  it('handles single-element array', () => {
    const out = seededShuffle([42], makeRng(1))
    expect(out).to.deep.equal([42])
  })

  it('returns a new array, not the input reference', () => {
    const arr = [1, 2, 3]
    const out = seededShuffle(arr, makeRng(1))
    expect(out).to.not.equal(arr)
  })
})
