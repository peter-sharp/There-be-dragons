/**
 * generate.js — Room tree generation from flashcards
 *
 * Takes a deck of flashcards + seed and produces:
 *   - An entrance room (6×6)
 *   - A hub room (12×12) with 3 locked doors
 *   - Branch rooms with sub-rooms as needed
 */

import { makeRng, seededShuffle } from './rng.js'

/** Door color hues for SVG filters (3 branches) */
const DOOR_HUES = [0, 120, 240] // red, green, blue

/** Paper color hues cycle */
const PAPER_HUES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330]

/**
 * Generate the full room tree from cards and seed.
 * @param {Array<{id: string, front: string, back: string, redHerrings: string[], repeats: number}>} cards
 * @param {number} seed
 * @returns {object} roomTree
 */
export function generateRoomTree(cards, seed) {
  const rng = makeRng(seed)

  // Expand cards by repeat count
  const expanded = []
  for (const card of cards) {
    for (let i = 0; i < (card.repeats || 1); i++) {
      expanded.push({ ...card, instanceId: `${card.id}-${i}` })
    }
  }

  const shuffled = seededShuffle(expanded, rng)

  // Reserve first card for hub
  const hubCard = shuffled[0]
  const remaining = shuffled.slice(1)

  // Split remaining into groups of 2-3
  const groups = splitIntoGroups(remaining, rng)

  // Ensure at least 3 groups (pad with smaller groups if needed)
  while (groups.length < 3) {
    groups.push([])
  }

  // First 3 groups are hub rooms (branches A, B, C)
  const branchGroups = [groups[0], groups[1], groups[2]]
  const overflowGroups = groups.slice(3)

  // Distribute overflow as sub-rooms round-robin
  const branchSubRooms = [[], [], []]
  for (let i = 0; i < overflowGroups.length; i++) {
    branchSubRooms[i % 3].push(overflowGroups[i])
  }

  // Determine branch order (which hub door opens first)
  const branchOrder = seededShuffle([0, 1, 2], rng)

  // Generate entrance room
  const entrance = generateEntranceRoom(rng)

  // Generate hub room
  const hub = generateHubRoom(hubCard, branchOrder, rng)

  // Generate branches
  const branches = branchOrder.map((branchIdx, orderIdx) => {
    const branchCards = branchGroups[branchIdx]
    const subRoomCardGroups = branchSubRooms[branchIdx]
    const doorHue = DOOR_HUES[branchIdx]
    const nextBranchDoorId = orderIdx < 2
      ? `hub-door-${branchOrder[orderIdx + 1]}`
      : null // last branch has no next door

    return generateBranch(
      branchIdx, branchCards, subRoomCardGroups,
      doorHue, nextBranchDoorId, rng
    )
  })

  // Connect entrance to hub
  entrance.doors = [{
    id: 'entrance-to-hub',
    pos: { x: 2, y: 0 },
    targetRoomId: hub.id,
    requiredKeyId: null, // always open
  }]

  // Add entrance door to hub (at bottom)
  hub.doors.push({
    id: 'hub-to-entrance',
    pos: { x: 5, y: 11 },
    targetRoomId: entrance.id,
    requiredKeyId: null,
  })

  return { entrance, hub, branches }
}

/**
 * Split cards into groups, guaranteeing at least 3 groups when possible.
 * Groups are 1-3 cards each. With 3+ cards, always produces 3+ groups.
 */
function splitIntoGroups(cards, rng) {
  if (cards.length <= 0) return []

  // With 3 or fewer cards, one per group
  if (cards.length <= 3) {
    return cards.map(c => [c])
  }

  // With 4-6 cards, distribute across exactly 3 groups
  if (cards.length <= 6) {
    const groups = [[], [], []]
    for (let i = 0; i < cards.length; i++) {
      groups[i % 3].push(cards[i])
    }
    return groups
  }

  // 7+ cards: fill 3 groups of 2-3, then split remainder into groups of 2-3
  const groups = []
  let i = 0
  while (i < cards.length) {
    const remaining = cards.length - i
    if (remaining <= 3) {
      groups.push(cards.slice(i))
      break
    }
    const size = rng() < 0.5 ? 2 : 3
    // Don't leave 1 card alone at the end
    const actualSize = (remaining - size === 1) ? size + 1 : size
    groups.push(cards.slice(i, i + Math.min(actualSize, 3)))
    i += Math.min(actualSize, 3)
  }
  return groups
}

/**
 * Generate the 6×6 entrance room.
 */
function generateEntranceRoom(rng) {
  const w = 6, h = 6
  const walls = buildWalls(w, h)

  // Open top center for door to hub
  walls.delete(`2,0`)
  walls.delete(`3,0`)

  // Player spawns at bottom center
  return {
    id: 'entrance',
    gridWidth: w,
    gridHeight: h,
    cards: [],
    boxes: [],
    papers: [],
    doors: [], // filled later
    entrance: { pos: { x: 2, y: 4 }, fromRoomId: null },
    walls,
  }
}

/**
 * Generate the 12×12 hub room.
 */
function generateHubRoom(hubCard, branchOrder, rng) {
  const w = 12, h = 12
  const walls = buildWalls(w, h)

  // Open bottom center for entrance
  walls.delete(`5,11`)
  walls.delete(`6,11`)

  // 3 door positions along top wall
  const doorPositions = [
    { x: 2, y: 0 },
    { x: 5, y: 0 },
    { x: 9, y: 0 },
  ]

  const doors = branchOrder.map((branchIdx, orderIdx) => {
    const pos = doorPositions[branchIdx]
    walls.delete(`${pos.x},${pos.y}`)
    return {
      id: `hub-door-${branchIdx}`,
      pos,
      targetRoomId: `branch-${branchIdx}-room-0`,
      requiredKeyId: orderIdx === 0
        ? `hub-box-key` // first door unlocked by hub box
        : `hub-door-${branchIdx}`, // subsequent doors unlocked by branch keys
      hue: DOOR_HUES[branchIdx],
    }
  })

  // Hub box
  const boxPos = placeSafe(w, h, walls, [{ x: 5, y: 5 }], [], rng) || { x: 3, y: 2 }
  const box = {
    id: 'hub-box',
    pos: boxPos,
    cardId: hubCard.instanceId || hubCard.id,
    front: hubCard.front,
    containsKey: 'hub-box-key',
  }

  // Papers for hub card
  const papers = generatePapersForCard(hubCard, 'hub', w, h, walls, [boxPos], rng)

  return {
    id: 'hub',
    gridWidth: w,
    gridHeight: h,
    cards: [hubCard],
    boxes: [box],
    papers,
    doors,
    entrance: { pos: { x: 5, y: 10 }, fromRoomId: 'entrance' },
    walls,
  }
}

/**
 * Generate a full branch (top room + sub-rooms).
 */
function generateBranch(branchIdx, topCards, subRoomCardGroups, doorHue, nextBranchDoorId, rng) {
  const rooms = []
  const allRoomGroups = [topCards, ...subRoomCardGroups].filter(g => g.length > 0)

  for (let roomIdx = 0; roomIdx < allRoomGroups.length; roomIdx++) {
    const roomCards = allRoomGroups[roomIdx]

    const roomId = `branch-${branchIdx}-room-${roomIdx}`
    const isDeepest = roomIdx === allRoomGroups.length - 1
    const hasSubRoom = roomIdx < allRoomGroups.length - 1

    // Grid size based on card count
    const cardCount = roomCards.length
    const w = cardCount === 1 ? 10 : cardCount === 2 ? 12 : 14
    const h = w

    const walls = buildWalls(w, h)

    // Entrance at bottom center
    const entranceX = Math.floor(w / 2)
    walls.delete(`${entranceX},${h - 1}`)
    const entrancePos = { x: entranceX, y: h - 2 }

    // Determine what's in this room
    const doors = []

    // Door to parent (entrance)
    const parentRoomId = roomIdx === 0 ? 'hub' : `branch-${branchIdx}-room-${roomIdx - 1}`
    doors.push({
      id: `${roomId}-to-parent`,
      pos: { x: entranceX, y: h - 1 },
      targetRoomId: parentRoomId,
      requiredKeyId: null, // always open going back
    })

    // Door to sub-room (if any)
    if (hasSubRoom) {
      const subDoorX = Math.floor(w / 2)
      walls.delete(`${subDoorX},0`)
      const subRoomId = `branch-${branchIdx}-room-${roomIdx + 1}`
      doors.push({
        id: `${roomId}-to-sub`,
        pos: { x: subDoorX, y: 0 },
        targetRoomId: subRoomId,
        requiredKeyId: `${roomId}-sub-key`,
        hue: doorHue,
      })
    }

    // Generate boxes
    const boxes = []
    const occupiedPositions = [entrancePos]

    for (let ci = 0; ci < roomCards.length; ci++) {
      const card = roomCards[ci]
      const boxPos = placeAlongWall(w, h, walls, occupiedPositions, rng)
      occupiedPositions.push(boxPos)

      // Determine what key this box contains
      let containsKey = null
      if (isDeepest && nextBranchDoorId && ci === roomCards.length - 1) {
        // Deepest room's last box has the hub-door key
        containsKey = nextBranchDoorId
      } else if (hasSubRoom && ci === 0) {
        // First box has key to sub-room
        containsKey = `${roomId}-sub-key`
      }

      boxes.push({
        id: `${roomId}-box-${ci}`,
        pos: boxPos,
        cardId: card.instanceId || card.id,
        front: card.front,
        containsKey,
      })
    }

    // Generate papers for all cards
    const allPapers = []
    for (const card of roomCards) {
      const papers = generatePapersForCard(
        card, roomId, w, h, walls,
        [...occupiedPositions, ...allPapers.map(p => p.pos)],
        rng
      )
      allPapers.push(...papers)
    }

    rooms.push({
      id: roomId,
      gridWidth: w,
      gridHeight: h,
      cards: roomCards,
      boxes,
      papers: allPapers,
      doors,
      entrance: { pos: entrancePos, fromRoomId: parentRoomId },
      walls,
      doorHue,
    })
  }

  return { rooms }
}

/**
 * Generate papers for a single card (1 correct + red herrings).
 */
function generatePapersForCard(card, roomId, w, h, walls, occupied, rng) {
  const papers = []
  let paperIdx = 0

  // Correct answer paper
  const correctPos = placeSafe(w, h, walls, occupied, papers.map(p => p.pos), rng)
  if (correctPos) {
    papers.push({
      id: `${roomId}-paper-${card.instanceId || card.id}-correct`,
      pos: correctPos,
      text: card.back,
      cardId: card.instanceId || card.id,
      isCorrect: true,
      hue: PAPER_HUES[paperIdx % PAPER_HUES.length],
    })
    paperIdx++
  }

  // Red herring papers
  for (const herring of (card.redHerrings || [])) {
    const pos = placeSafe(
      w, h, walls,
      [...occupied, ...papers.map(p => p.pos)],
      [],
      rng
    )
    if (pos) {
      papers.push({
        id: `${roomId}-paper-${card.instanceId || card.id}-herring-${paperIdx}`,
        pos,
        text: herring,
        cardId: card.instanceId || card.id,
        isCorrect: false,
        hue: PAPER_HUES[paperIdx % PAPER_HUES.length],
      })
      paperIdx++
    }
  }

  return papers
}

/**
 * Build wall set for a rectangular room.
 */
function buildWalls(w, h) {
  const walls = new Set()
  for (let x = 0; x < w; x++) {
    walls.add(`${x},0`)
    walls.add(`${x},${h - 1}`)
  }
  for (let y = 0; y < h; y++) {
    walls.add(`0,${y}`)
    walls.add(`${w - 1},${y}`)
  }
  return walls
}

/**
 * Place an entity on a safe walkable tile with minimum spacing.
 */
function placeSafe(w, h, walls, occupied, paperPositions, rng, minDist = 2) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = 2 + Math.floor(rng() * (w - 4))
    const y = 2 + Math.floor(rng() * (h - 4))
    const key = `${x},${y}`

    if (walls.has(key)) continue
    if (occupied.some(p => p.x === x && p.y === y)) continue

    // Check minimum distance from other papers
    const dist = minDist > 1 && paperPositions.length > 0
      ? paperPositions.every(p => Math.abs(p.x - x) + Math.abs(p.y - y) >= minDist)
      : true
    if (!dist && minDist > 1) {
      // Retry with reduced distance
      const fallback = placeSafe(w, h, walls, occupied, paperPositions, rng, 1)
      if (fallback) return fallback
      continue
    }

    return { x, y }
  }
  // Last resort — find any open tile
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      if (!walls.has(`${x},${y}`) && !occupied.some(p => p.x === x && p.y === y)) {
        return { x, y }
      }
    }
  }
  return null
}

/**
 * Place a box along an inner wall (1 tile from wall).
 */
function placeAlongWall(w, h, walls, occupied, rng) {
  const candidates = []
  // Top inner row
  for (let x = 2; x < w - 2; x++) candidates.push({ x, y: 1 })
  // Left inner column
  for (let y = 2; y < h - 2; y++) candidates.push({ x: 1, y })
  // Right inner column
  for (let y = 2; y < h - 2; y++) candidates.push({ x: w - 2, y })

  const shuffled = seededShuffle(candidates, rng)
  for (const pos of shuffled) {
    if (!occupied.some(o => o.x === pos.x && o.y === pos.y)) {
      return pos
    }
  }
  // Fallback
  return { x: 2, y: 1 }
}
