/**
 * Paper.js — Collectible paper entity SVG element
 * Uses colored SVG rects (hue-rotate doesn't reliably work on emoji)
 */

import { createElement as h } from 'react'
import htm from 'htm'

const html = htm.bind(h)
const TILE = 30

/** Convert hue (0-360) to an HSL fill color */
function hueToColor(hue) {
  return `hsl(${hue}, 50%, 70%)`
}

export function PaperEntity({ paper, collected }) {
  if (collected) return null

  const color = hueToColor(paper.hue || 0)

  return html`
    <g transform=${`translate(${paper.pos.x * TILE}, ${paper.pos.y * TILE})`}>
      <rect
        width=${TILE} height=${TILE}
        fill="#2a2a2a" stroke="#3a3a3a" stroke-width="0.5"
      />
      <rect
        x="4" y="3" width=${TILE - 8} height=${TILE - 6}
        fill=${color} stroke="#fff" stroke-width="0.5" rx="2"
        opacity="0.9"
      />
      <line x1="8" y1="10" x2=${TILE - 8} y2="10" stroke="#555" stroke-width="0.5" />
      <line x1="8" y1="15" x2=${TILE - 10} y2="15" stroke="#555" stroke-width="0.5" />
      <line x1="8" y1="20" x2=${TILE - 8} y2="20" stroke="#555" stroke-width="0.5" />
    </g>
  `
}
