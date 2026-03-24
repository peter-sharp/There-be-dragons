/**
 * WinScreen.js — Victory + play again
 */

import { createElement as h } from 'react'
import htm from 'htm'
import { useStore } from '../store.js'

const html = htm.bind(h)

export function WinScreen() {
  const goTo = useStore(s => s.goTo)
  const generateGame = useStore(s => s.generateGame)

  const handlePlayAgain = () => {
    generateGame()
    goTo('game')
  }

  return html`
    <div class="screen win-screen">
      <h1 class="title">Station Cleared</h1>

      <div class="narrative">
        <p>Every lock opened. Every box solved.</p>
        <p>The last journal entry reads:</p>
        <p class="attribution">
          <em>"Lock the doors and do not let them follow.
          The world is not ready for what we found."</em>
        </p>
        <p>You look out the window. Something moves in the trees.</p>
        <p>You understand now why they chose to stay.</p>
      </div>

      <button class="btn-primary" onClick=${handlePlayAgain}>
        Play Again (Same Cards)
      </button>

      <button class="btn-secondary" onClick=${() => goTo('cards')}>
        Change Cards
      </button>

      <button class="btn-link" onClick=${() => goTo('title')}>
        ← Title Screen
      </button>
    </div>
  `
}
