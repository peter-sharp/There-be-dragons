/**
 * HUD.js — Inventory bar, keys, active box interaction panel
 */

import { createElement as h } from 'react'
import htm from 'htm'
import { useStore, findRoom } from '../store.js'

const html = htm.bind(h)

export function HUD() {
  const inventory = useStore(s => s.inventory)
  const keysHeld = useStore(s => s.keysHeld)
  const activeBox = useStore(s => s.activeBox)
  const roomTree = useStore(s => s.roomTree)
  const currentRoomId = useStore(s => s.currentRoomId)
  const openedBoxes = useStore(s => s.openedBoxes)
  const tryPaperOnBox = useStore(s => s.tryPaperOnBox)

  const room = findRoom(roomTree, currentRoomId)
  const box = activeBox && room
    ? room.boxes.find(b => b.id === activeBox)
    : null

  const isBoxOpen = box && openedBoxes.includes(box.id)

  return html`
    <div class="hud">
      ${keysHeld.length > 0 && html`
        <div class="hud-keys">
          <span class="hud-label">Keys:</span>
          ${keysHeld.map(k => html`<span key=${k} class="key-icon">🔑</span>`)}
        </div>
      `}

      <div class="hud-inventory">
        <span class="hud-label">Papers (${inventory.length}):</span>
        ${inventory.length === 0 && html`
          <span class="hud-empty">Explore to find papers</span>
        `}
        ${inventory.map(paper => html`
          <div
            key=${paper.id}
            class="inventory-paper ${box && !isBoxOpen ? 'selectable' : ''}"
            onClick=${() => box && !isBoxOpen && tryPaperOnBox(paper.id, box.id)}
          >
            <span
              class="paper-dot"
              style=${{ background: `hsl(${paper.hue || 0}, 50%, 70%)` }}
            />
            <span class="paper-text">${paper.text}</span>
          </div>
        `)}
      </div>

      ${box && !isBoxOpen && html`
        <div class="box-panel">
          <div class="box-term">
            <span class="box-icon">📦</span>
            <strong>${box.front}</strong>
          </div>
          <p class="box-hint">Select a paper from your inventory to try</p>
        </div>
      `}

      ${box && isBoxOpen && html`
        <div class="box-panel box-opened">
          <span class="box-icon">📭</span>
          <span>Box opened!</span>
          ${box.containsKey && html`<span> Found a 🔑!</span>`}
        </div>
      `}
    </div>
  `
}
