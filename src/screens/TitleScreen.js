/**
 * TitleScreen.js — Story intro + Start button
 */

import { createElement as h } from 'react'
import htm from 'htm'
import { useStore } from '../store.js'

const html = htm.bind(h)

export function TitleScreen() {
  const goTo = useStore(s => s.goTo)

  return html`
    <div class="screen title-screen">
      <h1 class="title">There Be Dragons</h1>

      <div class="narrative">
        <p>The plane went down in the jungle.</p>
        <p>In the distance, through the trees — rooftops.</p>
        <p>
          A research station, sealed since 1912. The equipment is still running.
          The journals stop mid-sentence. Something is moving in the trees outside.
        </p>
        <p class="attribution">
          <em>"They chose to stay." — Dr. E. Morrow, July 14, 1912</em>
        </p>
      </div>

      <button class="btn-primary" onClick=${() => goTo('cards')}>
        Enter the Station
      </button>
    </div>
  `
}
