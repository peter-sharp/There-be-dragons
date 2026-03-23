import { createElement, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import htm from 'htm'
import { useStore } from './store.js'
import HUD from './components/HUD.js'
import NameScreen from './screens/NameScreen.js'
import HubScreen from './screens/HubScreen.js'
import RoomScreen from './screens/RoomScreen.js'
import { DeadScreen, WinScreen, AbilityCardScreen, BossScreen } from './screens/GameScreens.js'

const html = htm.bind(createElement)

/**
 * App — top-level screen router
 *
 * Reads `screen` from the store and renders the matching component.
 * All navigation is driven by store actions (goTo, enterRoom, etc.)
 * so this component never needs to be touched when adding new screens.
 *
 * Screen map:
 *   'names'        → NameScreen
 *   'hub'          → HubScreen
 *   'room'         → RoomScreen
 *   'ability-card' → AbilityCardScreen
 *   'boss'         → BossScreen
 *   'win'          → WinScreen
 *   'dead'         → DeadScreen
 */
function App() {
  const screen   = useStore(s => s.screen)
  const namesSet = useStore(s => s.namesSet)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.warn)
    }
  }, [])

  const renderScreen = () => {
    switch (screen) {
      case 'names':        return html`<${NameScreen} />`
      case 'hub':          return html`<${HubScreen} />`
      case 'room':         return html`<${RoomScreen} />`
      case 'ability-card': return html`<${AbilityCardScreen} />`
      case 'boss':         return html`<${BossScreen} />`
      case 'win':          return html`<${WinScreen} />`
      case 'dead':         return html`<${DeadScreen} />`
      default:             return html`<${NameScreen} />`
    }
  }

  // Show HUD on all screens except name entry and end screens
  const showHud = !['names', 'win', 'dead'].includes(screen)

  return html`
    <div className="app">
      ${showHud && html`<${HUD} />`}
      <main className="app__main">${renderScreen()}</main>
    </div>
  `
}

createRoot(document.getElementById('root')).render(html`<${App} />`)
