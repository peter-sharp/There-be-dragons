import { createElement, useState } from 'react'
import htm from 'htm'
import { useStore, KID_DEFS } from '../store.js'

const html = htm.bind(createElement)

/**
 * NameScreen
 *
 * First screen the player sees. Sets names for all three kids.
 * Skippable — defaults are pre-filled (Sam, Alex, Pip).
 * After submission, navigates to hub and starts a new run.
 */
export default function NameScreen() {
  const kidNames    = useStore(s => s.kidNames)
  const setKidNames = useStore(s => s.setKidNames)
  const startRun    = useStore(s => s.startRun)
  const goToHub     = useStore(s => s.goToHub)

  const [names, setNames] = useState({
    oldest:   kidNames.oldest,
    middle:   kidNames.middle,
    youngest: kidNames.youngest,
  })

  const handleChange = (id, value) =>
    setNames(n => ({ ...n, [id]: value || KID_DEFS.find(k => k.id === id).id }))

  const handleStart = () => {
    setKidNames(names)
    startRun()
    goToHub()
  }

  return html`
    <div className="screen names-screen">
      <div className="names-screen__header">
        <p className="names-screen__location">✈️  Amazon Basin · En Route</p>
        <h1 className="names-screen__title">There Be Dragons</h1>
        <p className="names-screen__intro">
          The plane went down in the jungle. Somewhere through the trees, your Dad spots a rooftop.
          You're going to need each other.
        </p>
      </div>

      <p className="names-screen__prompt">Name your three explorers:</p>

      <div className="names-screen__kids">
        ${KID_DEFS.map(kid => html`
          <div key=${kid.id} className="kid-entry">
            <div className="kid-entry__header">
              <span className="kid-entry__emoji">${kid.emoji}</span>
              <div>
                <span className="kid-entry__age">${`Age ${kid.age} · ${kid.subject}`}</span>
                <p className="kid-entry__personality">${kid.personality}</p>
              </div>
            </div>
            <input
              className="kid-entry__input"
              type="text"
              value=${names[kid.id]}
              placeholder=${kid.id === 'oldest' ? 'Sam' : kid.id === 'middle' ? 'Alex' : 'Pip'}
              maxLength=${12}
              aria-label=${`Name for age ${kid.age} explorer`}
              onChange=${e => handleChange(kid.id, e.target.value)}
            />
            <p className="kid-entry__catchphrase">${`"${kid.catchphrase}"`}</p>
          </div>
        `)}
      </div>

      <div className="names-screen__dad">
        <span>🧑‍🦳</span>
        <p>"Don't worry about me — I'll keep watch. Now go. All three of you. Together."</p>
      </div>

      <button className="btn btn--primary btn--full" onClick=${handleStart}>
        Enter the Station →
      </button>
    </div>
  `
}
