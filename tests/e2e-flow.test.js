/**
 * End-to-end game flow test.
 *
 * Simulates a complete play session through the store API:
 *   title → add cards → generate game → solve all rooms → win
 *
 * No browser required — runs entirely through the Zustand store.
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Mock localStorage for zustand persist
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

function resetStore() {
  useStore.setState({
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
  })
}

/**
 * Collect all rooms from the tree as a flat array.
 */
function collectAllRooms(tree) {
  const rooms = [tree.entrance, tree.hub]
  for (const branch of tree.branches) rooms.push(...branch.rooms)
  return rooms
}

/**
 * Solve a room: collect all papers, solve all boxes, recurse into sub-rooms.
 */
function solveRoom(roomId) {
  const state = getState()
  const room = findRoom(state.roomTree, roomId)
  if (!room) return

  // Make sure we're in this room
  useStore.setState({ currentRoomId: roomId }, false)

  // Collect all uncollected papers
  for (const paper of room.papers) {
    if (!getState().collectedPapers.includes(paper.id)) {
      getState().collectPaper(paper)
    }
  }

  // Solve all boxes
  for (const box of room.boxes) {
    if (getState().openedBoxes.includes(box.id)) continue
    const correctPaper = getState().inventory.find(
      p => p.isCorrect && p.cardId === box.cardId
    )
    if (correctPaper) {
      getState().tryPaperOnBox(correctPaper.id, box.id)
    }
  }

  // Enter sub-room doors (doors leading deeper, not back to parent)
  for (const door of room.doors) {
    // Skip doors going back to parent
    if (door.id.endsWith('-to-parent')) continue
    if (door.id === 'hub-to-entrance') continue
    if (door.id === 'entrance-to-hub') {
      // Don't recurse back from hub perspective
      continue
    }
    // Check if this door leads to a room we haven't visited
    const targetRoom = findRoom(getState().roomTree, door.targetRoomId)
    if (targetRoom) {
      solveRoom(door.targetRoomId)
      // Come back to this room after solving sub-room
      useStore.setState({ currentRoomId: roomId }, false)
    }
  }
}

describe('end-to-end game flow', () => {
  beforeEach(resetStore)

  it('complete game: cards → generate → solve all rooms', () => {
    // 1. Start on title screen
    assert.strictEqual(getState().screen, 'title')

    // 2. Navigate to card entry
    getState().goTo('cards')
    assert.strictEqual(getState().screen, 'cards')

    // 3. Add flashcards (minimum 4)
    getState().addCard({ front: 'Capital of France', back: 'Paris', redHerrings: ['London', 'Berlin'], repeats: 1 })
    getState().addCard({ front: 'Capital of Japan', back: 'Tokyo', redHerrings: ['Osaka'], repeats: 1 })
    getState().addCard({ front: '2 + 2', back: '4', redHerrings: ['3', '5'], repeats: 1 })
    getState().addCard({ front: 'H2O is', back: 'Water', redHerrings: ['Fire'], repeats: 1 })
    assert.strictEqual(getState().cards.length, 4)

    // 4. Generate game
    getState().generateGame()
    const tree = getState().roomTree
    assert.ok(tree, 'roomTree should be generated')
    assert.strictEqual(getState().currentRoomId, 'entrance')

    // 5. Navigate to game screen
    getState().goTo('game')
    assert.strictEqual(getState().screen, 'game')

    // 6. Verify entrance connects to hub
    const entrance = findRoom(tree, 'entrance')
    const hubDoor = entrance.doors.find(d => d.targetRoomId === 'hub')
    assert.ok(hubDoor, 'entrance should have door to hub')

    // 7. Enter hub
    getState().enterDoor(hubDoor)
    assert.strictEqual(getState().currentRoomId, 'hub')

    // 8. Solve hub (collect papers, solve box, get hub-box-key)
    solveRoom('hub')

    // Verify hub box solved
    const hubBox = tree.hub.boxes[0]
    assert.ok(getState().openedBoxes.includes(hubBox.id), 'hub box should be opened')
    assert.ok(getState().keysHeld.includes('hub-box-key'), 'should have hub-box-key')

    // 9. Solve all branch rooms
    for (const branch of tree.branches) {
      for (const room of branch.rooms) {
        solveRoom(room.id)
      }
    }

    // 10. Verify all boxes are opened
    const allBoxes = collectAllRooms(tree).flatMap(r => r.boxes)
    for (const box of allBoxes) {
      assert.ok(
        getState().openedBoxes.includes(box.id),
        `box ${box.id} should be opened`
      )
    }

    // 11. Verify all correct papers were consumed from inventory
    const remainingCorrect = getState().inventory.filter(p => p.isCorrect)
    assert.strictEqual(remainingCorrect.length, 0, 'all correct papers should be consumed')
  })

  it('game is deterministic — same cards produce same layout', () => {
    // Game 1
    getState().addCard({ front: 'A', back: 'B', redHerrings: ['C'], repeats: 1 })
    getState().addCard({ front: 'D', back: 'E', redHerrings: ['F'], repeats: 1 })
    getState().addCard({ front: 'G', back: 'H', redHerrings: ['I'], repeats: 1 })
    getState().addCard({ front: 'J', back: 'K', redHerrings: ['L'], repeats: 1 })
    getState().generateGame()
    const tree1 = getState().roomTree
    const seed1 = getState().seed

    // Game 2 — reset and add same cards
    resetStore()
    getState().addCard({ front: 'A', back: 'B', redHerrings: ['C'], repeats: 1 })
    getState().addCard({ front: 'D', back: 'E', redHerrings: ['F'], repeats: 1 })
    getState().addCard({ front: 'G', back: 'H', redHerrings: ['I'], repeats: 1 })
    getState().addCard({ front: 'J', back: 'K', redHerrings: ['L'], repeats: 1 })
    getState().generateGame()
    const tree2 = getState().roomTree
    const seed2 = getState().seed

    assert.strictEqual(seed1, seed2, 'seeds should match')
    assert.strictEqual(tree1.hub.boxes.length, tree2.hub.boxes.length)
    assert.deepStrictEqual(
      tree1.hub.boxes.map(b => b.id),
      tree2.hub.boxes.map(b => b.id)
    )
  })

  it('movement works in entrance room', () => {
    addMinCards()
    getState().generateGame()
    const startPos = { ...getState().playerPos }

    // Try moving in all 4 directions, at least one should work
    const positions = []
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      useStore.setState({ playerPos: { ...startPos } }, false)
      getState().movePlayer(dx, dy)
      positions.push({ ...getState().playerPos })
    }

    const moved = positions.some(p => p.x !== startPos.x || p.y !== startPos.y)
    assert.ok(moved, 'player should be able to move in at least one direction')
  })

  it('cannot walk through walls', () => {
    addMinCards()
    getState().generateGame()

    // Move far left — should be blocked by wall
    for (let i = 0; i < 20; i++) getState().movePlayer(-1, 0)
    const pos = getState().playerPos
    // Should still be within room bounds (entrance is 6x6)
    assert.ok(pos.x >= 0 && pos.x < 6)
    assert.ok(pos.y >= 0 && pos.y < 6)
  })

  it('CSV import → generate → solve flow', () => {
    // Import cards via CSV
    getState().importCSV(
      'front,back,h1,h2,h3,h4,repeats\n' +
      'Sun,Star,Planet,Moon,,,1\n' +
      'Earth,Planet,Star,Moon,,,1\n' +
      'Water,H2O,CO2,NaCl,,,1\n' +
      'Dog,Animal,Plant,Rock,,,1'
    )
    assert.strictEqual(getState().cards.length, 4)

    getState().generateGame()
    const tree = getState().roomTree
    assert.ok(tree)

    // Solve everything
    solveRoom('entrance')
    solveRoom('hub')
    for (const branch of tree.branches) {
      for (const room of branch.rooms) solveRoom(room.id)
    }

    const allBoxes = collectAllRooms(tree).flatMap(r => r.boxes)
    for (const box of allBoxes) {
      assert.ok(getState().openedBoxes.includes(box.id), `box ${box.id} not opened`)
    }
  })
})

function addMinCards() {
  getState().addCard({ front: 'Q1', back: 'A1', redHerrings: ['W1'], repeats: 1 })
  getState().addCard({ front: 'Q2', back: 'A2', redHerrings: ['W2'], repeats: 1 })
  getState().addCard({ front: 'Q3', back: 'A3', redHerrings: ['W3'], repeats: 1 })
  getState().addCard({ front: 'Q4', back: 'A4', redHerrings: ['W4'], repeats: 1 })
}
