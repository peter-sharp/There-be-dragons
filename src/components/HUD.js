import { createElement } from 'react'
import htm from 'htm'
import { useStore, STARTING_TORCHES } from '../store.js'

const html = htm.bind(createElement)

/**
 * HUD — persistent top bar
 * Shows torch count and back-to-hub button when inside a room.
 */
export default function HUD() {
  const screen    = useStore(s => s.screen)
  const torches   = useStore(s => s.torches)
  const goToHub   = useStore(s => s.goToHub)

  const inRoom = screen === 'room' || screen === 'boss'

  return html`
    <div className="hud">
      ${inRoom
        ? html`<button className="hud__back" onClick=${goToHub}>← Station</button>`
        : html`<span className="hud__spacer" />`}
      <div className="hud__torches">
        ${Array.from({ length: STARTING_TORCHES }, (_, i) =>
          html`<span
            key=${i}
            className=${`hud__torch ${i < torches ? 'hud__torch--lit' : 'hud__torch--spent'}`}
            aria-label=${i < torches ? 'torch' : 'spent torch'}
          >${i < torches ? '🔦' : '·'}</span>`
        )}
      </div>
    </div>
  `
}
