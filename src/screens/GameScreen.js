/**
 * GameScreen.js — Main game view: Room + HUD + win detection
 */

import { createElement as h, useEffect } from 'react'
import htm from 'htm'
import { useStore, findRoom } from '../store.js'
import { Room } from '../components/Room.js'
import { HUD } from '../components/HUD.js'

const html = htm.bind(h)

export function GameScreen() {
  const roomTree = useStore(s => s.roomTree)
  const currentRoomId = useStore(s => s.currentRoomId)
  const openedBoxes = useStore(s => s.openedBoxes)
  const goTo = useStore(s => s.goTo)
  const narrativeText = useStore(s => s.narrativeText)
  const setNarrativeText = useStore(s => s.setNarrativeText)
  const clearNarrativeText = useStore(s => s.clearNarrativeText)

  // Show narrative on entrance room
  useEffect(() => {
    if (currentRoomId === 'entrance') {
      setNarrativeText('You push open the heavy door. The air inside is stale — but the lights are on.')
    } else if (currentRoomId === 'hub') {
      setNarrativeText('Challenger Station. Three doors. A locked box on the table.')
    } else {
      clearNarrativeText()
    }
  }, [currentRoomId])

  // Win detection: check if all boxes in all rooms are opened
  useEffect(() => {
    if (!roomTree) return
    const allBoxes = getAllBoxIds(roomTree)
    if (allBoxes.length > 0 && allBoxes.every(id => openedBoxes.includes(id))) {
      goTo('win')
    }
  }, [openedBoxes.length])

  if (!roomTree) return html`<div class="screen">Loading...</div>`

  const room = findRoom(roomTree, currentRoomId)
  const roomLabel = getRoomLabel(currentRoomId)

  return html`
    <div class="screen game-screen">
      <div class="game-header">
        <span class="room-label">${roomLabel}</span>
      </div>

      ${narrativeText && html`
        <div class="narrative-overlay" onClick=${clearNarrativeText}>
          <p>${narrativeText}</p>
          <span class="narrative-dismiss">tap to continue</span>
        </div>
      `}

      <${Room} />
      <${HUD} />
    </div>
  `
}

function getRoomLabel(roomId) {
  if (roomId === 'entrance') return 'Entrance'
  if (roomId === 'hub') return 'Challenger Station — Hub'
  const match = roomId.match(/branch-(\d+)-room-(\d+)/)
  if (match) {
    const branch = ['A', 'B', 'C'][parseInt(match[1])]
    const depth = parseInt(match[2])
    return depth === 0 ? `Room ${branch}` : `Room ${branch}-${depth}`
  }
  return roomId
}

function getAllBoxIds(roomTree) {
  const ids = []
  ids.push(...roomTree.hub.boxes.map(b => b.id))
  for (const branch of roomTree.branches) {
    for (const room of branch.rooms) {
      ids.push(...room.boxes.map(b => b.id))
    }
  }
  return ids
}
