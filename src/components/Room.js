/**
 * Room.js — SVG grid renderer + movement handler
 */

import { createElement as h, useEffect, useCallback } from 'react'
import htm from 'htm'
import { useStore, findRoom } from '../store.js'
import { Player } from './Player.js'
import { PaperEntity } from './Paper.js'
import { BoxEntity } from './Box.js'
import { DoorEntity } from './Door.js'

const html = htm.bind(h)
const TILE = 30

export function Room() {
  const roomTree = useStore(s => s.roomTree)
  const currentRoomId = useStore(s => s.currentRoomId)
  const playerPos = useStore(s => s.playerPos)
  const collectedPapers = useStore(s => s.collectedPapers)
  const openedBoxes = useStore(s => s.openedBoxes)
  const unlockedDoors = useStore(s => s.unlockedDoors)
  const movePlayer = useStore(s => s.movePlayer)
  const setActiveBox = useStore(s => s.setActiveBox)

  const room = findRoom(roomTree, currentRoomId)
  if (!room) return null

  const { gridWidth: w, gridHeight: hh, walls, boxes, papers, doors } = room

  // Keyboard movement
  const handleKey = useCallback(e => {
    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); movePlayer(0, -1); break
      case 'ArrowDown': e.preventDefault(); movePlayer(0, 1); break
      case 'ArrowLeft': e.preventDefault(); movePlayer(-1, 0); break
      case 'ArrowRight': e.preventDefault(); movePlayer(1, 0); break
    }
  }, [movePlayer])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Click/tap to move (adjacent tiles only)
  const handleClick = e => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const scaleX = (w * TILE) / rect.width
    const scaleY = (hh * TILE) / rect.height
    const clickX = Math.floor((e.clientX - rect.left) * scaleX / TILE)
    const clickY = Math.floor((e.clientY - rect.top) * scaleY / TILE)

    const dx = clickX - playerPos.x
    const dy = clickY - playerPos.y

    // Only move if adjacent (4-directional)
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      movePlayer(dx, dy)
    }
  }

  // Check if player is adjacent to any box
  useEffect(() => {
    const adjacentBox = boxes.find(b => {
      if (openedBoxes.includes(b.id)) return false
      const dx = Math.abs(b.pos.x - playerPos.x)
      const dy = Math.abs(b.pos.y - playerPos.y)
      return (dx + dy) === 1
    })
    setActiveBox(adjacentBox?.id || null)
  }, [playerPos.x, playerPos.y, openedBoxes.length])

  return html`
    <svg
      viewBox=${`0 0 ${w * TILE} ${hh * TILE}`}
      class="room-svg"
      onClick=${handleClick}
      style=${{ maxWidth: `${w * TILE}px` }}
    >
      ${Array.from({ length: hh }, (_, y) =>
        Array.from({ length: w }, (_, x) => {
          const isWall = walls.has(`${x},${y}`)
          const isDoor = doors.some(d => d.pos.x === x && d.pos.y === y)
          if (isDoor) return null
          return html`
            <rect
              key=${`${x},${y}`}
              x=${x * TILE} y=${y * TILE}
              width=${TILE} height=${TILE}
              fill=${isWall ? '#4a3a2a' : '#2a2a2a'}
              stroke="#3a3a3a" stroke-width="0.5"
            />
          `
        })
      )}

      ${doors.map(door => html`
        <${DoorEntity}
          key=${door.id}
          door=${door}
          unlocked=${!door.requiredKeyId || unlockedDoors.includes(door.requiredKeyId)}
        />
      `)}

      ${papers.map(paper => html`
        <${PaperEntity}
          key=${paper.id}
          paper=${paper}
          collected=${collectedPapers.includes(paper.id)}
        />
      `)}

      ${boxes.map(box => html`
        <${BoxEntity}
          key=${box.id}
          box=${box}
          opened=${openedBoxes.includes(box.id)}
        />
      `)}

      <${Player} pos=${playerPos} />
    </svg>
  `
}
