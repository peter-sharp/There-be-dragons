import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { generateRoomTree } from '../src/generate.js'
import { hashCards } from '../src/rng.js'

const TEST_CARDS = [
  { id: 'c1', front: 'Capital of France', back: 'Paris', redHerrings: ['London', 'Berlin'], repeats: 1 },
  { id: 'c2', front: 'Capital of Japan', back: 'Tokyo', redHerrings: ['Osaka'], repeats: 1 },
  { id: 'c3', front: '2+2', back: '4', redHerrings: ['3', '5'], repeats: 1 },
  { id: 'c4', front: 'H2O', back: 'Water', redHerrings: ['Fire'], repeats: 1 },
]

const seed = hashCards(TEST_CARDS)

describe('generateRoomTree', () => {
  it('returns a tree with entrance, hub, and branches', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    assert.ok(tree.entrance, 'missing entrance')
    assert.ok(tree.hub, 'missing hub')
    assert.ok(Array.isArray(tree.branches), 'branches is not an array')
    assert.strictEqual(tree.branches.length, 3)
  })

  it('entrance room has correct properties', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const { entrance } = tree
    assert.strictEqual(entrance.id, 'entrance')
    assert.strictEqual(entrance.gridWidth, 6)
    assert.strictEqual(entrance.gridHeight, 6)
    assert.ok(entrance.walls instanceof Set, 'walls should be a Set')
    assert.ok(Array.isArray(entrance.doors), 'doors should be an array')
    assert.ok(entrance.entrance.pos, 'entrance should have a spawn position')
  })

  it('hub room has boxes, papers, and 3 branch doors', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const { hub } = tree
    assert.strictEqual(hub.id, 'hub')
    assert.strictEqual(hub.gridWidth, 12)
    assert.strictEqual(hub.gridHeight, 12)
    assert.ok(hub.boxes.length >= 1, 'hub should have at least 1 box')
    assert.ok(hub.papers.length >= 1, 'hub should have at least 1 paper')
    // 3 branch doors + 1 entrance door = 4 total
    const branchDoors = hub.doors.filter(d => d.id.startsWith('hub-door-'))
    assert.strictEqual(branchDoors.length, 3, 'hub should have 3 branch doors')
  })

  it('each branch has at least one room', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    for (const branch of tree.branches) {
      assert.ok(branch.rooms.length >= 1, 'branch must have at least one room')
    }
  })

  it('is deterministic (same cards + seed = same tree)', () => {
    const tree1 = generateRoomTree(TEST_CARDS, seed)
    const tree2 = generateRoomTree(TEST_CARDS, seed)
    // Compare structural properties (can't deep-equal Sets directly)
    assert.strictEqual(tree1.hub.boxes.length, tree2.hub.boxes.length)
    assert.strictEqual(tree1.hub.papers.length, tree2.hub.papers.length)
    assert.deepStrictEqual(
      tree1.hub.boxes.map(b => b.id),
      tree2.hub.boxes.map(b => b.id)
    )
    for (let i = 0; i < 3; i++) {
      assert.strictEqual(tree1.branches[i].rooms.length, tree2.branches[i].rooms.length)
      assert.deepStrictEqual(
        tree1.branches[i].rooms.map(r => r.id),
        tree2.branches[i].rooms.map(r => r.id)
      )
    }
  })

  it('every card appears as a box somewhere in the tree', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const allBoxes = collectAllBoxes(tree)
    // Each card's expanded instanceId should appear
    for (const card of TEST_CARDS) {
      const found = allBoxes.some(b => b.cardId.startsWith(card.id))
      assert.ok(found, `card ${card.id} (${card.front}) not found in any box`)
    }
  })

  it('every box has a matching correct paper in its room', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const rooms = collectAllRooms(tree)
    for (const room of rooms) {
      for (const box of room.boxes) {
        const correctPaper = room.papers.find(
          p => p.cardId === box.cardId && p.isCorrect
        )
        assert.ok(
          correctPaper,
          `box ${box.id} in room ${room.id} has no matching correct paper`
        )
      }
    }
  })

  it('hub branch doors point to valid branch room IDs', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const branchDoors = tree.hub.doors.filter(d => d.id.startsWith('hub-door-'))
    const allRoomIds = collectAllRooms(tree).map(r => r.id)
    for (const door of branchDoors) {
      assert.ok(
        allRoomIds.includes(door.targetRoomId),
        `hub door ${door.id} targets non-existent room ${door.targetRoomId}`
      )
    }
  })

  it('entrance connects to hub', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const entranceDoor = tree.entrance.doors.find(d => d.targetRoomId === 'hub')
    assert.ok(entranceDoor, 'entrance should have a door to hub')
    assert.strictEqual(entranceDoor.requiredKeyId, null, 'entrance-to-hub should be unlocked')
  })

  it('hub box contains hub-box-key', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const hubBox = tree.hub.boxes[0]
    assert.strictEqual(hubBox.containsKey, 'hub-box-key')
  })

  it('generates valid room grids with walls', () => {
    const tree = generateRoomTree(TEST_CARDS, seed)
    const rooms = collectAllRooms(tree)
    for (const room of rooms) {
      assert.ok(room.gridWidth >= 6, `room ${room.id} too narrow: ${room.gridWidth}`)
      assert.ok(room.gridHeight >= 6, `room ${room.id} too short: ${room.gridHeight}`)
      assert.ok(room.walls instanceof Set, `room ${room.id} walls should be a Set`)
      assert.ok(room.walls.size > 0, `room ${room.id} should have walls`)
    }
  })
})

// Helpers
function collectAllRooms(tree) {
  const rooms = [tree.entrance, tree.hub]
  for (const branch of tree.branches) {
    rooms.push(...branch.rooms)
  }
  return rooms
}

function collectAllBoxes(tree) {
  return collectAllRooms(tree).flatMap(r => r.boxes)
}
