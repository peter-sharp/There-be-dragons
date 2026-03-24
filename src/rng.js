/**
 * rng.js — Seeded random number generation
 *
 * Mulberry32 PRNG + Fisher-Yates shuffle.
 * Same seed always produces the same sequence.
 */

/**
 * Simple seeded PRNG (mulberry32).
 * Returns a function that produces floats in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
export const makeRng = seed => {
  let s = seed
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/**
 * Shuffle an array using a seeded rng (Fisher-Yates).
 * @template T
 * @param {T[]} arr
 * @param {() => number} rng
 * @returns {T[]}
 */
export const seededShuffle = (arr, rng) => {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Hash an array of cards into a deterministic numeric seed.
 * Uses a simple string hash (djb2) on the JSON of sorted card content.
 * @param {Array<{front: string, back: string, redHerrings: string[]}>} cards
 * @returns {number}
 */
export const hashCards = cards => {
  const sorted = [...cards]
    .map(c => `${c.front}|${c.back}|${(c.redHerrings || []).join(',')}`)
    .sort()
    .join(';;')
  let hash = 5381
  for (let i = 0; i < sorted.length; i++) {
    hash = ((hash << 5) + hash + sorted.charCodeAt(i)) >>> 0
  }
  return hash
}
