import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { makeRng, seededShuffle, hashCards } from '../src/rng.js'

describe('makeRng', () => {
  it('produces deterministic sequence from same seed', () => {
    const rng1 = makeRng(42)
    const rng2 = makeRng(42)
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    assert.deepStrictEqual(seq1, seq2)
  })

  it('produces different sequences from different seeds', () => {
    const rng1 = makeRng(1)
    const rng2 = makeRng(2)
    const seq1 = Array.from({ length: 5 }, () => rng1())
    const seq2 = Array.from({ length: 5 }, () => rng2())
    assert.notDeepStrictEqual(seq1, seq2)
  })

  it('produces values in [0, 1)', () => {
    const rng = makeRng(999)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      assert.ok(v >= 0, `value ${v} is < 0`)
      assert.ok(v < 1, `value ${v} is >= 1`)
    }
  })
})

describe('seededShuffle', () => {
  it('produces deterministic shuffle from same seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    const result1 = seededShuffle(arr, makeRng(100))
    const result2 = seededShuffle(arr, makeRng(100))
    assert.deepStrictEqual(result1, result2)
  })

  it('preserves all elements', () => {
    const arr = [10, 20, 30, 40, 50]
    const result = seededShuffle(arr, makeRng(7))
    assert.strictEqual(result.length, arr.length)
    for (const item of arr) {
      assert.ok(result.includes(item), `missing element ${item}`)
    }
  })

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5]
    const original = [...arr]
    seededShuffle(arr, makeRng(5))
    assert.deepStrictEqual(arr, original)
  })

  it('actually shuffles (not identity for non-trivial input)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = seededShuffle(arr, makeRng(42))
    // Extremely unlikely to be identical for 10 elements
    assert.notDeepStrictEqual(result, arr)
  })
})

describe('hashCards', () => {
  const cards = [
    { front: 'Q1', back: 'A1', redHerrings: ['W1'] },
    { front: 'Q2', back: 'A2', redHerrings: ['W2', 'W3'] },
  ]

  it('produces deterministic hash', () => {
    const h1 = hashCards(cards)
    const h2 = hashCards(cards)
    assert.strictEqual(h1, h2)
  })

  it('is order-independent (sorts internally)', () => {
    const reversed = [...cards].reverse()
    assert.strictEqual(hashCards(cards), hashCards(reversed))
  })

  it('produces different hashes for different cards', () => {
    const other = [{ front: 'X', back: 'Y', redHerrings: [] }]
    assert.notStrictEqual(hashCards(cards), hashCards(other))
  })

  it('returns a number', () => {
    assert.strictEqual(typeof hashCards(cards), 'number')
  })
})
