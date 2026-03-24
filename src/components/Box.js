/**
 * Box.js — Locked box entity SVG element
 */

import { createElement as h } from 'react'
import htm from 'htm'

const html = htm.bind(h)
const TILE = 30

export function BoxEntity({ box, opened }) {
  return html`
    <g transform=${`translate(${box.pos.x * TILE}, ${box.pos.y * TILE})`}>
      <rect
        width=${TILE} height=${TILE}
        fill=${opened ? '#2a4a2a' : '#5a4030'}
        stroke=${opened ? '#2e7d32' : '#d4870a'}
        stroke-width="1.5" rx="3"
      />
      <text
        x=${TILE / 2} y=${TILE / 2 + 5}
        text-anchor="middle" font-size="16"
      >${opened ? '📭' : '📦'}</text>
    </g>
  `
}
