/**
 * Player.js — Player entity SVG element
 */

import { createElement as h } from 'react'
import htm from 'htm'

const html = htm.bind(h)
const TILE = 30

export function Player({ pos }) {
  return html`
    <g transform=${`translate(${pos.x * TILE}, ${pos.y * TILE})`}>
      <rect
        width=${TILE} height=${TILE}
        fill="#1a4a1a" stroke="#2e7d32" stroke-width="2" rx="4"
      />
      <text
        x=${TILE / 2} y=${TILE / 2 + 5}
        text-anchor="middle" font-size="18"
      >🧑</text>
    </g>
  `
}
