/**
 * store.js — There Be Dragons · Game State
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * THREE SLICES
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  metaSlice  — persists between runs (kid names, total runs played)
 *  runSlice   — active run state (torches, rooms cleared, seed)
 *  uiSlice    — transient navigation (current screen)
 *
 * Only metaSlice is saved to localStorage via persist/partialize.
 * runSlice and uiSlice reset completely on every new run.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SCENE GRAPH
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  'names'         — name entry screen (first launch only, or reset)
 *  'hub'           — Challenger Station map, choose next room
 *  'room'          — inside a room, puzzle chain active
 *  'ability-card'  — special moment: ability card revealed
 *  'boss'          — final combined puzzle (all 3 rooms cleared)
 *  'win'           — run complete, mystery solved
 *  'dead'          — torches hit 0, permadeath screen
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

export const STARTING_TORCHES = 5

/** The three kids — ages and subjects are fixed, names are set by player */
export const KID_DEFS = [
  {
    id: 'oldest',
    age: 13,
    subject: 'literacy',
    room: 'library',
    emoji: '📖',
    personality: 'Careful and precise. Reads everything twice.',
    catchphrase: 'Hold on — let me read that again.',
  },
  {
    id: 'middle',
    age: 10,
    subject: 'maths',
    room: 'engine',
    emoji: '⚙️',
    personality: 'Energetic. Jumps to conclusions. Usually right.',
    catchphrase: "I've already worked it out.",
  },
  {
    id: 'youngest',
    age: 8,
    subject: 'science',
    room: 'specimens',
    emoji: '🔬',
    personality: 'Fearless. Asks questions nobody else thinks to ask.',
    catchphrase: 'But what does it EAT?',
  },
]

/** Room definitions — subject, lead kid, display info */
export const ROOM_DEFS = {
  library: {
    id: 'library',
    label: 'The Library',
    kidId: 'oldest',
    emoji: '📖',
    desc: 'Journals from the 1912 expedition. The last entry stops mid-sentence.',
    lockedDesc: 'Clear another room first.',
  },
  engine: {
    id: 'engine',
    label: 'The Engine Room',
    kidId: 'middle',
    emoji: '⚙️',
    desc: 'Banks of dials, still running. Something is powering this place that shouldn\'t be.',
    lockedDesc: 'Clear another room first.',
  },
  specimens: {
    id: 'specimens',
    label: 'The Specimen Hall',
    kidId: 'youngest',
    emoji: '🔬',
    desc: 'Jars of samples. Sketches of animals with no Latin names. A smell that doesn\'t belong.',
    lockedDesc: 'Clear another room first.',
  },
}

// ─────────────────────────────────────────────────────────
// SEEDED RANDOM — deterministic shuffle per run
//
// Each run gets a numeric seed. Using it for puzzle order
// means the same seed always produces the same run — useful
// for debugging and potential future "share your run" feature.
// ─────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────
// SLICE: Meta
//
// The ONLY slice that survives between runs.
// Persisted to localStorage via partialize.
// ─────────────────────────────────────────────────────────

/** @param {Function} set */
const createMetaSlice = set => ({
  /** Whether player has entered kid names at least once */
  namesSet: false,

  /** Names indexed by kid id */
  kidNames: {
    oldest: 'Sam',
    middle: 'Alex',
    youngest: 'Pip',
  },

  /** Total runs attempted (flavour / stats) */
  totalRuns: 0,

  /** Set all three kid names at once */
  setKidNames: names => set(
    { kidNames: names, namesSet: true },
    false,
    'meta/setKidNames'
  ),

  /** Increment run counter */
  incrementRuns: () => set(
    state => ({ totalRuns: state.totalRuns + 1 }),
    false,
    'meta/incrementRuns'
  ),
})

// ─────────────────────────────────────────────────────────
// SLICE: Run
//
// Everything about the current run. Wiped on startRun().
// Roguelike state lives here — torches, cleared rooms, seed.
// ─────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   effect: string,
 *   emoji: string,
 *   kidId: string,
 * }} AbilityCard
 */

/** @param {Function} set @param {Function} get */
const createRunSlice = (set, get) => ({
  /** Is a run currently active? */
  active: false,

  /** Shared family torch pool. 0 = permadeath. */
  torches: STARTING_TORCHES,

  /** Room ids cleared this run */
  roomsCleared: /** @type {string[]} */ ([]),

  /**
   * Clues collected this run — used for escape-room chaining
   * and boss puzzle. Map of roomId → clue string.
   */
  cluesFound: /** @type {Record<string, string>} */ ({}),

  /** Ability cards earned this run */
  abilityCards: /** @type {AbilityCard[]} */ ([]),

  /**
   * Numeric seed for this run.
   * Drives puzzle order randomisation via seededShuffle.
   * Generated fresh each startRun().
   */
  seed: 0,

  // ── Run lifecycle ──────────────────────────────────────

  /**
   * Start a fresh run. Wipes all run state, generates new seed.
   * Called from hub when player confirms new game, or from dead screen.
   */
  startRun: () => {
    get().incrementRuns()
    set(
      {
        active: true,
        torches: STARTING_TORCHES,
        roomsCleared: [],
        cluesFound: {},
        abilityCards: [],
        seed: Math.floor(Math.random() * 2 ** 32),
      },
      false,
      'run/startRun'
    )
  },

  /** End the run without winning — permadeath */
  endRun: () => set(
    { active: false },
    false,
    'run/endRun'
  ),

  // ── Torch management ───────────────────────────────────

  /**
   * Spend one torch (wrong answer).
   * Returns true if the family is now dead (torches hit 0).
   * Caller should check and navigate to 'dead' scene.
   */
  spendTorch: () => {
    const next = get().torches - 1
    set({ torches: next }, false, 'run/spendTorch')
    return next <= 0
  },

  /** Gain torches (room cleared reward) */
  gainTorch: (amount = 1) => set(
    state => ({ torches: state.torches + amount }),
    false,
    'run/gainTorch'
  ),

  // ── Room management ────────────────────────────────────

  /**
   * Mark a room as cleared. Awards +1 torch.
   * @param {string} roomId
   */
  clearRoom: roomId => set(
    state => ({
      roomsCleared: [...new Set([...state.roomsCleared, roomId])],
      torches: state.torches + 1,
    }),
    false,
    'run/clearRoom'
  ),

  /**
   * Store a clue found in a room.
   * Clues feed into subsequent puzzles (escape-room chaining)
   * and the boss encounter.
   * @param {string} roomId
   * @param {string} clue
   */
  storeClue: (roomId, clue) => set(
    state => ({ cluesFound: { ...state.cluesFound, [roomId]: clue } }),
    false,
    'run/storeClue'
  ),

  // ── Ability cards ──────────────────────────────────────

  /**
   * Add an ability card to the family's hand.
   * @param {AbilityCard} card
   */
  addAbilityCard: card => set(
    state => ({ abilityCards: [...state.abilityCards, card] }),
    false,
    'run/addAbilityCard'
  ),

  /**
   * Use (consume) an ability card by id.
   * @param {string} cardId
   */
  useAbilityCard: cardId => set(
    state => ({ abilityCards: state.abilityCards.filter(c => c.id !== cardId) }),
    false,
    'run/useAbilityCard'
  ),
})

// ─────────────────────────────────────────────────────────
// SLICE: UI
//
// Current screen and any transient navigation state.
// Never persisted. Reset to 'hub' on startRun().
// ─────────────────────────────────────────────────────────

/** @param {Function} set */
const createUiSlice = set => ({
  /**
   * Current screen. Valid values:
   *   'names'        — name entry (first run or reset)
   *   'hub'          — station map, choose next room
   *   'room'         — inside a room, puzzle chain active
   *   'ability-card' — ability card reveal moment
   *   'boss'         — final combined puzzle
   *   'win'          — run complete
   *   'dead'         — permadeath screen
   */
  screen: 'names',

  /** Which room is currently active (when screen === 'room') */
  activeRoom: /** @type {string|null} */ (null),

  /** Navigate to a screen */
  goTo: (screen, activeRoom = null) => set(
    { screen, activeRoom },
    false,
    `ui/goTo:${screen}`
  ),

  /** Enter a room — sets screen and activeRoom together */
  enterRoom: roomId => set(
    { screen: 'room', activeRoom: roomId },
    false,
    'ui/enterRoom'
  ),

  /** Return to hub */
  goToHub: () => set(
    { screen: 'hub', activeRoom: null },
    false,
    'ui/goToHub'
  ),
})

// ─────────────────────────────────────────────────────────
// ROOT STORE
// ─────────────────────────────────────────────────────────

export const useStore = create(
  devtools(
    persist(
      (...args) => ({
        ...createMetaSlice(...args),
        ...createRunSlice(...args),
        ...createUiSlice(...args),
      }),
      {
        name: 'dragons-save',
        // Only persist meta — run and ui always start fresh
        partialize: state => ({
          namesSet: state.namesSet,
          kidNames: state.kidNames,
          totalRuns: state.totalRuns,
        }),
      }
    ),
    { name: 'There Be Dragons' }
  )
)

// Convenience accessor for use outside React (game loops etc.)
export const getState = () => useStore.getState()
