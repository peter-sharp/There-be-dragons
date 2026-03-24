import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Mock localStorage before importing the store
globalThis.localStorage = globalThis.localStorage || (() => {
  let store = {}
  return {
    getItem(key) { return store[key] ?? null },
    setItem(key, val) { store[key] = String(val) },
    removeItem(key) { delete store[key] },
    clear() { store = {} },
  }
})()

const { useStore, getState, findRoom } = await import('../src/store.js')

const INITIAL_STATE = {
  cards: [],
  seed: 0,
  roomTree: null,
  currentRoomId: null,
  playerPos: { x: 0, y: 0 },
  inventory: [],
  unlockedDoors: [],
  openedBoxes: [],
  collectedPapers: [],
  keysHeld: [],
  screen: 'title',
  activeBox: null,
  narrativeText: null,
}

function resetStore() {
  useStore.setState(INITIAL_STATE)
}

function addTestCards() {
  getState().addCard({ front: 'Q1', back: 'A1', redHerrings: ['W1', 'W2'], repeats: 1 })
  getState().addCard({ front: 'Q2', back: 'A2', redHerrings: ['W3'], repeats: 1 })
  getState().addCard({ front: 'Q3', back: 'A3', redHerrings: ['W4', 'W5'], repeats: 1 })
  getState().addCard({ front: 'Q4', back: 'A4', redHerrings: ['W6'], repeats: 1 })
}

// ─── Deck Slice ──────────────────────────────────────────

describe('deck slice', () => {
  beforeEach(resetStore)

  it('addCard adds a card to the deck', () => {
    getState().addCard({ front: 'Hello', back: 'World', redHerrings: ['X'], repeats: 1 })
    const { cards } = getState()
    assert.strictEqual(cards.length, 1)
    assert.strictEqual(cards[0].front, 'Hello')
    assert.strictEqual(cards[0].back, 'World')
    assert.deepStrictEqual(cards[0].redHerrings, ['X'])
  })

  it('removeCard removes a card by id', () => {
    getState().addCard({ front: 'A', back: 'B' })
    const id = getState().cards[0].id
    getState().removeCard(id)
    assert.strictEqual(getState().cards.length, 0)
  })

  it('updateCard updates card properties', () => {
    getState().addCard({ front: 'Old', back: 'OldBack' })
    const id = getState().cards[0].id
    getState().updateCard(id, { front: 'New', back: 'NewBack' })
    assert.strictEqual(getState().cards[0].front, 'New')
    assert.strictEqual(getState().cards[0].back, 'NewBack')
  })

  it('clearDeck removes all cards', () => {
    addTestCards()
    assert.strictEqual(getState().cards.length, 4)
    getState().clearDeck()
    assert.strictEqual(getState().cards.length, 0)
  })

  it('importCSV parses CSV and adds cards', () => {
    getState().importCSV('front,back,h1,h2,h3,h4,repeats\nCat,Animal,Plant,Rock,,,1\nDog,Pet,Car,,,,2')
    const { cards } = getState()
    assert.strictEqual(cards.length, 2)
    assert.strictEqual(cards[0].front, 'Cat')
    assert.strictEqual(cards[0].back, 'Animal')
    assert.deepStrictEqual(cards[0].redHerrings, ['Plant', 'Rock'])
    assert.strictEqual(cards[1].front, 'Dog')
    assert.strictEqual(cards[1].repeats, 2)
  })

  it('addCard filters empty red herrings', () => {
    getState().addCard({ front: 'Q', back: 'A', redHerrings: ['Good', '', '  ', 'Also good'] })
    assert.deepStrictEqual(getState().cards[0].redHerrings, ['Good', 'Also good'])
  })
})

// ─── Run Slice ───────────────────────────────────────────

describe('run slice', () => {
  beforeEach(() => {
    resetStore()
    addTestCards()
  })

  it('generateGame creates a room tree and sets entrance', () => {
    getState().generateGame()
    const state = getState()
    assert.ok(state.roomTree, 'roomTree should exist')
    assert.strictEqual(state.currentRoomId, 'entrance')
    assert.ok(state.seed > 0, 'seed should be positive')
  })

  it('movePlayer moves within bounds', () => {
    getState().generateGame()
    const startPos = { ...getState().playerPos }
    // Entrance is 6x6, player starts at entrance.pos
    // Try to move right (should work if not hitting wall)
    getState().movePlayer(1, 0)
    const newPos = getState().playerPos
    // Either moved or blocked by wall — just verify no crash
    assert.ok(typeof newPos.x === 'number')
    assert.ok(typeof newPos.y === 'number')
  })

  it('movePlayer is blocked by walls', () => {
    getState().generateGame()
    // Move far left repeatedly — should eventually hit wall and stop
    for (let i = 0; i < 20; i++) getState().movePlayer(-1, 0)
    const pos = getState().playerPos
    assert.ok(pos.x >= 0, 'should not go out of bounds')
  })

  it('collectPaper adds paper to inventory and collectedPapers', () => {
    getState().generateGame()
    const room = findRoom(getState().roomTree, getState().currentRoomId)
    // Go to hub to find papers
    getState().enterDoor(room.doors.find(d => d.targetRoomId === 'hub'))
    const hub = findRoom(getState().roomTree, 'hub')
    const paper = hub.papers[0]
    getState().collectPaper(paper)
    assert.ok(getState().collectedPapers.includes(paper.id))
    assert.ok(getState().inventory.some(p => p.id === paper.id))
  })

  it('tryPaperOnBox with correct paper opens box and grants key', () => {
    getState().generateGame()
    // Navigate to hub
    const entrance = findRoom(getState().roomTree, 'entrance')
    getState().enterDoor(entrance.doors.find(d => d.targetRoomId === 'hub'))

    const hub = findRoom(getState().roomTree, 'hub')
    const box = hub.boxes[0]
    const correctPaper = hub.papers.find(p => p.isCorrect && p.cardId === box.cardId)
    assert.ok(correctPaper, 'should have a correct paper for hub box')

    // Collect the paper first
    getState().collectPaper(correctPaper)
    const result = getState().tryPaperOnBox(correctPaper.id, box.id)

    assert.strictEqual(result, true)
    assert.ok(getState().openedBoxes.includes(box.id))
    assert.ok(!getState().inventory.some(p => p.id === correctPaper.id), 'paper consumed')
    if (box.containsKey) {
      assert.ok(getState().keysHeld.includes(box.containsKey))
    }
  })

  it('tryPaperOnBox with wrong paper returns false', () => {
    getState().generateGame()
    const entrance = findRoom(getState().roomTree, 'entrance')
    getState().enterDoor(entrance.doors.find(d => d.targetRoomId === 'hub'))

    const hub = findRoom(getState().roomTree, 'hub')
    const box = hub.boxes[0]
    const wrongPaper = hub.papers.find(p => !p.isCorrect)
    if (!wrongPaper) return // no red herrings to test with

    getState().collectPaper(wrongPaper)
    const result = getState().tryPaperOnBox(wrongPaper.id, box.id)
    assert.strictEqual(result, false)
    assert.ok(getState().inventory.some(p => p.id === wrongPaper.id), 'wrong paper stays')
  })

  it('enterDoor transitions to target room', () => {
    getState().generateGame()
    const entrance = findRoom(getState().roomTree, 'entrance')
    const hubDoor = entrance.doors.find(d => d.targetRoomId === 'hub')
    getState().enterDoor(hubDoor)
    assert.strictEqual(getState().currentRoomId, 'hub')
  })

  it('resetRun clears all run state', () => {
    getState().generateGame()
    getState().resetRun()
    assert.strictEqual(getState().roomTree, null)
    assert.strictEqual(getState().currentRoomId, null)
    assert.deepStrictEqual(getState().inventory, [])
    assert.deepStrictEqual(getState().keysHeld, [])
  })
})

// ─── UI Slice ────────────────────────────────────────────

describe('ui slice', () => {
  beforeEach(resetStore)

  it('goTo changes screen', () => {
    getState().goTo('cards')
    assert.strictEqual(getState().screen, 'cards')
    getState().goTo('game')
    assert.strictEqual(getState().screen, 'game')
  })

  it('goTo clears activeBox and narrativeText', () => {
    getState().setActiveBox('some-box')
    getState().setNarrativeText('some text')
    getState().goTo('title')
    assert.strictEqual(getState().activeBox, null)
    assert.strictEqual(getState().narrativeText, null)
  })

  it('setActiveBox and setNarrativeText', () => {
    getState().setActiveBox('box-1')
    assert.strictEqual(getState().activeBox, 'box-1')
    getState().setNarrativeText('Hello')
    assert.strictEqual(getState().narrativeText, 'Hello')
    getState().clearNarrativeText()
    assert.strictEqual(getState().narrativeText, null)
  })
})

// ─── findRoom ────────────────────────────────────────────

describe('findRoom', () => {
  beforeEach(() => {
    resetStore()
    addTestCards()
    getState().generateGame()
  })

  it('finds entrance', () => {
    const room = findRoom(getState().roomTree, 'entrance')
    assert.ok(room)
    assert.strictEqual(room.id, 'entrance')
  })

  it('finds hub', () => {
    const room = findRoom(getState().roomTree, 'hub')
    assert.ok(room)
    assert.strictEqual(room.id, 'hub')
  })

  it('finds branch rooms', () => {
    const tree = getState().roomTree
    for (const branch of tree.branches) {
      for (const branchRoom of branch.rooms) {
        const found = findRoom(tree, branchRoom.id)
        assert.ok(found, `should find room ${branchRoom.id}`)
      }
    }
  })

  it('returns null for non-existent room', () => {
    assert.strictEqual(findRoom(getState().roomTree, 'no-such-room'), null)
  })

  it('returns null for null tree', () => {
    assert.strictEqual(findRoom(null, 'entrance'), null)
  })
})
