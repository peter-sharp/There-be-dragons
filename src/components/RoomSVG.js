import { createElement } from 'react'
import htm from 'htm'
import { makeRng } from '../store.js'

const html = htm.bind(createElement)

// ── Scene constants ───────────────────────────────────────

const W = 320   // viewBox width
const H = 160   // viewBox height
const COLS = 8  // grid columns
const ROWS = 5  // grid rows
const MID = H / 2  // wall / floor boundary (y)

// ── Room palettes: [R, G, B] for wall and floor zones ────

const PALETTES = {
  library:   { wall: [28, 21, 10],  floor: [58, 42, 20]  },
  engine:    { wall: [12, 20, 34],  floor: [26, 42, 62]  },
  specimens: { wall: [12, 22, 16],  floor: [26, 48, 32]  },
}

// ── Emoji items: position in viewBox space ────────────────
//  y is text baseline — emoji top ~= y - fontSize

const ITEMS = {
  library: [
    { emoji: '📚', x: 44,  y: 140, fontSize: 26 },
    { emoji: '🕯️', x: 144, y: 124, fontSize: 22 },
    { emoji: '📜', x: 220, y: 142, fontSize: 22 },
    { emoji: '🪑', x: 282, y: 150, fontSize: 20 },
  ],
  engine: [
    { emoji: '⚙️', x: 50,  y: 132, fontSize: 26 },
    { emoji: '🔧', x: 162, y: 144, fontSize: 22 },
    { emoji: '💡', x: 250, y: 122, fontSize: 22 },
    { emoji: '🔩', x: 112, y: 152, fontSize: 18 },
  ],
  specimens: [
    { emoji: '🔬', x: 56,  y: 134, fontSize: 26 },
    { emoji: '🧪', x: 158, y: 140, fontSize: 22 },
    { emoji: '🫙', x: 254, y: 137, fontSize: 22 },
    { emoji: '🦎', x: 108, y: 150, fontSize: 20 },
  ],
}

// Drop-shadow glow colours per room (warm / cool blue / lab green)
const GLOWS = {
  library:   'rgba(212,135,10,0.7)',
  engine:    'rgba(80,140,220,0.55)',
  specimens: 'rgba(60,180,90,0.55)',
}

// ── Scene generator ───────────────────────────────────────

/**
 * Build low-poly triangle data for a room.
 * Uses a deterministic seeded RNG based on the room ID string
 * so the scene looks the same every time.
 */
function buildScene(roomId) {
  const palette = PALETTES[roomId] || PALETTES.library

  // Derive a seed from the room ID characters
  const seed = roomId.split('').reduce(
    (h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 0
  )
  const rng = makeRng(seed)

  const cellW = W / COLS
  const cellH = H / ROWS
  const jx = cellW * 0.22   // max horizontal jitter
  const jy = cellH * 0.22   // max vertical jitter

  // Generate jittered grid points — corners/edges stay fixed
  const pts = []
  for (let r = 0; r <= ROWS; r++) {
    for (let c = 0; c <= COLS; c++) {
      const ox = (c > 0 && c < COLS) ? (rng() - 0.5) * 2 * jx : 0
      const oy = (r > 0 && r < ROWS) ? (rng() - 0.5) * 2 * jy : 0
      pts.push([(c / COLS) * W + ox, (r / ROWS) * H + oy])
    }
  }

  // Tessellate each cell into 2 triangles
  const triangles = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tl = pts[r * (COLS + 1) + c]
      const tr = pts[r * (COLS + 1) + c + 1]
      const bl = pts[(r + 1) * (COLS + 1) + c]
      const br = pts[(r + 1) * (COLS + 1) + c + 1]
      triangles.push([tl, tr, bl])
      triangles.push([tr, br, bl])
    }
  }

  // Assign fill colour per triangle
  return triangles.map(tri => {
    const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3
    const isWall = cy < MID
    const base = isWall ? palette.wall : palette.floor

    // Gradient: both zones brighten toward the mid-horizon
    const vt    = isWall ? cy / MID : (cy - MID) / MID   // 0 → 1 top-to-mid or mid-to-bottom
    const grad  = 0.78 + vt * 0.22                        // 0.78 → 1.0
    const facet = 0.88 + rng() * 0.24                     // per-triangle brightness variation

    const factor = grad * facet
    const [r, g, b] = base.map(ch =>
      Math.min(255, Math.max(0, Math.round(ch * factor)))
    )
    return {
      points: tri.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' '),
      fill: `rgb(${r},${g},${b})`,
    }
  })
}

// Pre-compute all three scenes once at module load
const SCENES = Object.fromEntries(
  ['library', 'engine', 'specimens'].map(id => [id, buildScene(id)])
)

// ── Component ─────────────────────────────────────────────

/**
 * RoomSVG — renders a low-poly tile-based room scene as SVG.
 *
 * Each room gets a deterministic triangulated background
 * (wall zone above, floor zone below) with emoji items
 * glowing in the room's accent colour.
 *
 * @param {{ roomId: string, size?: 'thumb' | 'full' }} props
 */
export default function RoomSVG({ roomId }) {
  const triangles = SCENES[roomId]
  if (!triangles) return null

  const items = ITEMS[roomId] || []
  const glow  = GLOWS[roomId]  || GLOWS.library
  const filterId = `room-glow-${roomId}`

  return html`
    <svg
      viewBox="0 0 ${W} ${H}"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="${roomId} room scene"
      data-room=${roomId}
      style=${{ display: 'block', width: '100%' }}
    >
      <defs>
        <filter id=${filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor=${glow}
            floodOpacity="1"
          />
        </filter>
      </defs>

      ${triangles.map((tri, i) => html`
        <polygon key=${i} points=${tri.points} fill=${tri.fill} />
      `)}

      ${items.map((item, i) => html`
        <text
          key=${i}
          x=${item.x}
          y=${item.y}
          fontSize=${item.fontSize}
          filter=${`url(#${filterId})`}
          className="room-svg__item"
          aria-hidden="true"
        >${item.emoji}</text>
      `)}
    </svg>
  `
}
