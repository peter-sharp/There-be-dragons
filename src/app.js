/**
 * app.js — Screen router + service worker registration
 */

import { createElement as h } from 'react'
import { createRoot } from 'react-dom/client'
import htm from 'htm'
import { useStore } from './store.js'
import { TitleScreen } from './screens/TitleScreen.js'
import { CardEntryScreen } from './screens/CardEntryScreen.js'
import { GameScreen } from './screens/GameScreen.js'
import { WinScreen } from './screens/WinScreen.js'

const html = htm.bind(h)

function App() {
  const screen = useStore(s => s.screen)

  switch (screen) {
    case 'title': return html`<${TitleScreen} />`
    case 'cards': return html`<${CardEntryScreen} />`
    case 'game': return html`<${GameScreen} />`
    case 'win': return html`<${WinScreen} />`
    default: return html`<${TitleScreen} />`
  }
}

// Mount
createRoot(document.getElementById('root')).render(html`<${App} />`)

// Service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
