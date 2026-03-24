/**
 * store.js — There Be Dragons · Game State
 *
 * THREE SLICES:
 *   deckSlice  — persists between runs (flashcard deck)
 *   runSlice   — active run state (rooms, player, inventory)
 *   uiSlice    — transient navigation (current screen)
 */

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { hashCards } from './rng.js'
import { generateRoomTree } from './generate.js'

// ─────────────────────────────────────────────────────────
// SLICE: Deck (persisted to localStorage)
// ─────────────────────────────────────────────────────────

let nextCardId = Date.now()

/** @param {Function} set @param {Function} get */
const createDeckSlice = (set, get) => ({
  /** @type {Array<{id: string, front: string, back: string, redHerrings: string[], repeats: number}>} */
  cards: [],

  addCard: ({ front, back, redHerrings = [], repeats = 1 }) => set(
    state => ({
      cards: [...state.cards, {
        id: `card-${nextCardId++}`,
        front,
        back,
        redHerrings: redHerrings.filter(h => h.trim()),
        repeats,
      }]
    }),
    false,
    'deck/addCard'
  ),

  updateCard: (id, updates) => set(
    state => ({
      cards: state.cards.map(c =>
        c.id === id
          ? { ...c, ...updates, redHerrings: (updates.redHerrings || c.redHerrings).filter(h => h.trim()) }
          : c
      )
    }),
    false,
    'deck/updateCard'
  ),

  removeCard: id => set(
    state => ({ cards: state.cards.filter(c => c.id !== id) }),
    false,
    'deck/removeCard'
  ),

  clearDeck: () => set(
    { cards: [] },
    false,
    'deck/clearDeck'
  ),

  importCSV: csvText => {
    const lines = csvText.trim().split('\n')
    const newCards = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      // Skip header row if it looks like one
      if (i === 0 && line.toLowerCase().startsWith('front')) continue
      const cols = line.split(',').map(c => c.trim())
      if (cols.length < 2) continue
      const [front, back, h1, h2, h3, h4, rep] = cols
      newCards.push({
        id: `card-${nextCardId++}`,
        front,
        back,
        redHerrings: [h1, h2, h3, h4].filter(h => h && h.trim()),
        repeats: parseInt(rep) || 1,
      })
    }
    set(
      state => ({ cards: [...state.cards, ...newCards] }),
      false,
      'deck/importCSV'
    )
  },
})

// ─────────────────────────────────────────────────────────
// SLICE: Run (reset each game)
// ─────────────────────────────────────────────────────────

/** @param {Function} set @param {Function} get */
const createRunSlice = (set, get) => ({
  seed: 0,
  roomTree: null,
  currentRoomId: null,
  playerPos: { x: 0, y: 0 },
  /** @type {Array<{id: string, text: string, cardId: string, isCorrect: boolean}>} */
  inventory: [],
  /** @type {string[]} */
  unlockedDoors: [],
  /** @type {string[]} */
  openedBoxes: [],
  /** @type {string[]} */
  collectedPapers: [],
  /** @type {string[]} */
  keysHeld: [],

  generateGame: () => {
    const { cards } = get()
    const seed = hashCards(cards)
    const roomTree = generateRoomTree(cards, seed)
    const entrance = roomTree.entrance
    set({
      seed,
      roomTree,
      currentRoomId: entrance.id,
      playerPos: { ...entrance.entrance.pos },
      inventory: [],
      unlockedDoors: [],
      openedBoxes: [],
      collectedPapers: [],
      keysHeld: [],
    }, false, 'run/generateGame')
  },

  movePlayer: (dx, dy) => {
    const { currentRoomId, roomTree, playerPos, unlockedDoors, collectedPapers } = get()
    const room = findRoom(roomTree, currentRoomId)
    if (!room) return

    const nx = playerPos.x + dx
    const ny = playerPos.y + dy

    // Bounds check
    if (nx < 0 || ny < 0 || nx >= room.gridWidth || ny >= room.gridHeight) return

    // Wall check
    if (room.walls.has(`${nx},${ny}`)) return

    // Box check — can't walk onto boxes
    if (room.boxes.some(b => b.pos.x === nx && b.pos.y === ny)) return

    // Locked door check (doors without requiredKeyId are always passable)
    const door = room.doors.find(d => d.pos.x === nx && d.pos.y === ny)
    if (door && door.requiredKeyId && !unlockedDoors.includes(door.requiredKeyId)) return

    // Move player
    set({ playerPos: { x: nx, y: ny } }, false, 'run/movePlayer')

    // Check for paper pickup
    const paper = room.papers.find(
      p => p.pos.x === nx && p.pos.y === ny && !collectedPapers.includes(p.id)
    )
    if (paper) {
      get().collectPaper(paper)
    }

    // Check for door transition (always-open doors have no requiredKeyId)
    if (door && (!door.requiredKeyId || unlockedDoors.includes(door.requiredKeyId))) {
      get().enterDoor(door)
    }
  },

  collectPaper: paper => set(
    state => ({
      collectedPapers: [...state.collectedPapers, paper.id],
      inventory: [...state.inventory, {
        id: paper.id,
        text: paper.text,
        cardId: paper.cardId,
        isCorrect: paper.isCorrect,
        hue: paper.hue || 0,
      }],
    }),
    false,
    'run/collectPaper'
  ),

  tryPaperOnBox: (paperId, boxId) => {
    const { inventory, roomTree, currentRoomId } = get()
    const paper = inventory.find(p => p.id === paperId)
    const room = findRoom(roomTree, currentRoomId)
    const box = room?.boxes.find(b => b.id === boxId)
    if (!paper || !box) return false

    if (paper.isCorrect && paper.cardId === box.cardId) {
      // Correct — open box, consume paper
      const updates = {
        openedBoxes: [...get().openedBoxes, boxId],
        inventory: get().inventory.filter(p => p.id !== paperId),
      }
      // If box contains a key, add it
      if (box.containsKey) {
        updates.keysHeld = [...get().keysHeld, box.containsKey]
        // Auto-unlock the matching door
        updates.unlockedDoors = [...get().unlockedDoors, box.containsKey]
      }
      set(updates, false, 'run/tryPaperOnBox:correct')
      return true
    }
    // Wrong — no penalty, paper stays in inventory
    return false
  },

  enterDoor: door => {
    const { roomTree } = get()
    const targetRoom = findRoom(roomTree, door.targetRoomId)
    if (!targetRoom) return
    set({
      currentRoomId: door.targetRoomId,
      playerPos: { ...targetRoom.entrance.pos },
    }, false, 'run/enterDoor')
  },

  resetRun: () => set({
    seed: 0,
    roomTree: null,
    currentRoomId: null,
    playerPos: { x: 0, y: 0 },
    inventory: [],
    unlockedDoors: [],
    openedBoxes: [],
    collectedPapers: [],
    keysHeld: [],
  }, false, 'run/resetRun'),
})

/**
 * Find a room by id in the room tree (hub, entrance, or any branch room).
 * @param {object} roomTree
 * @param {string} roomId
 * @returns {object|null}
 */
function findRoom(roomTree, roomId) {
  if (!roomTree) return null
  if (roomTree.entrance.id === roomId) return roomTree.entrance
  if (roomTree.hub.id === roomId) return roomTree.hub
  for (const branch of roomTree.branches) {
    for (const room of branch.rooms) {
      if (room.id === roomId) return room
    }
  }
  return null
}

export { findRoom }

// ─────────────────────────────────────────────────────────
// SLICE: UI (transient)
// ─────────────────────────────────────────────────────────

/** @param {Function} set */
const createUiSlice = set => ({
  /** @type {'title' | 'cards' | 'game' | 'win'} */
  screen: 'title',
  /** @type {string|null} */
  activeBox: null,
  /** @type {string|null} */
  narrativeText: null,

  goTo: screen => set(
    { screen, activeBox: null, narrativeText: null },
    false,
    `ui/goTo:${screen}`
  ),

  setActiveBox: boxId => set(
    { activeBox: boxId },
    false,
    'ui/setActiveBox'
  ),

  setNarrativeText: text => set(
    { narrativeText: text },
    false,
    'ui/setNarrativeText'
  ),

  clearNarrativeText: () => set(
    { narrativeText: null },
    false,
    'ui/clearNarrativeText'
  ),
})

// ─────────────────────────────────────────────────────────
// ROOT STORE
// ─────────────────────────────────────────────────────────

export const useStore = create(
  devtools(
    persist(
      (...args) => ({
        ...createDeckSlice(...args),
        ...createRunSlice(...args),
        ...createUiSlice(...args),
      }),
      {
        name: 'dragons-save',
        partialize: state => ({
          cards: state.cards,
        }),
      }
    ),
    { name: 'There Be Dragons' }
  )
)

export const getState = () => useStore.getState()
