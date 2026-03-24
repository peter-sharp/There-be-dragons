/**
 * Door.js — Door entity SVG element (locked/unlocked)
 */

import { createElement as h } from 'react'
import htm from 'htm'

const html = htm.bind(h)
const TILE = 30

export function DoorEntity({ door, unlocked }) {
  // Doors without a requiredKeyId are always-open passages
  const isPassage = !door.requiredKeyId
  const isOpen = isPassage || unlocked
  const doorHue = door.hue || 0

  return html`
    <g
      transform=${`translate(${door.pos.x * TILE}, ${door.pos.y * TILE})`}
      style=${{ filter: !isPassage ? `hue-rotate(${doorHue}deg)` : 'none' }}
    >
      <rect
        width=${TILE} height=${TILE}
        fill=${isOpen ? '#2e5a2e' : '#5a4a2a'}
        stroke=${isOpen ? '#3a6a3a' : '#8a6a3a'}
        stroke-width="1" rx="2"
      />
      <text
        x=${TILE / 2} y=${TILE / 2 + 4}
        text-anchor="middle" font-size="10"
        fill=${isOpen ? '#8f8' : '#d4870a'}
        font-family="monospace"
      >${isOpen ? '▫' : '🔒'}</text>
    </g>
  `
}
