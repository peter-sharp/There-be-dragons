import { createElement } from 'react'
import htm from 'htm'
import { useStore, KID_DEFS, ROOM_DEFS, STARTING_TORCHES } from '../store.js'

const html = htm.bind(createElement)

/**
 * HubScreen — Challenger Station map
 *
 * Shows the three rooms, current torch count, and which rooms
 * have been cleared this run. Player picks which room to enter next.
 * Boss room unlocks when all three rooms are cleared.
 */
export default function HubScreen() {
  const screen       = useStore(s => s.screen)
  const kidNames     = useStore(s => s.kidNames)
  const torches      = useStore(s => s.torches)
  const roomsCleared = useStore(s => s.roomsCleared)
  const totalRuns    = useStore(s => s.totalRuns)
  const enterRoom    = useStore(s => s.enterRoom)
  const goTo         = useStore(s => s.goTo)
  const startRun     = useStore(s => s.startRun)
  const active       = useStore(s => s.active)

  const allRoomsCleared = Object.keys(ROOM_DEFS).every(id => roomsCleared.includes(id))

  // If navigating back to hub but no active run, start one
  const handleEnterRoom = roomId => {
    if (!active) startRun()
    enterRoom(roomId)
  }

  const getKidName = kidId => kidNames[kidId]

  return html`
    <div className="screen hub-screen">

      <div className="hub__header">
        <p className="hub__location">📍 Challenger Station · Amazon Basin · Est. 1912</p>
        <h1 className="hub__title">There Be Dragons</h1>
        ${totalRuns > 1 && html`<p className="hub__runs">${`Run #${totalRuns}`}</p>`}
      </div>

      <div className="torch-bar">
        <span className="torch-bar__label">Torches</span>
        <div className="torch-bar__pips">
          ${Array.from({ length: STARTING_TORCHES }, (_, i) =>
            html`<span
              key=${i}
              className=${`torch-pip ${i < torches ? 'torch-pip--lit' : 'torch-pip--spent'}`}
            >${i < torches ? '🔦' : '○'}</span>`
          )}
        </div>
        <span className="torch-bar__count">${`${torches} left`}</span>
      </div>

      <div className="hub__dad">
        <span className="hub__dad-icon">🧑‍🦳</span>
        <p className="hub__dad-text">
          ${allRoomsCleared
            ? `"You've been through every room. I think... I think you're ready for the central hall."`
            : roomsCleared.length === 0
              ? `"Three rooms. Pick one — but stay together. And don't open the outside door."`
              : `"${roomsCleared.length} down. Keep going. You're doing brilliantly."`}
        </p>
      </div>

      <div className="hub__rooms">
        ${Object.values(ROOM_DEFS).map(room => {
          const kid = KID_DEFS.find(k => k.id === room.kidId)
          const cleared = roomsCleared.includes(room.id)
          return html`
            <button
              key=${room.id}
              className=${`room-card ${cleared ? 'room-card--done' : 'room-card--unlocked'}`}
              onClick=${() => handleEnterRoom(room.id)}
            >
              <div className="room-card__top">
                <span className="room-card__emoji">${room.emoji}</span>
                <div className="room-card__meta">
                  <span className="room-card__subject">${`${getKidName(kid.id)}'s room · ${kid.subject}`}</span>
                  <h2 className="room-card__label">${room.label}</h2>
                </div>
                ${cleared && html`<span className="room-card__badge">✓</span>`}
              </div>
              <p className="room-card__desc">
                ${cleared ? `${getKidName(kid.id)} found something important here.` : room.desc}
              </p>
            </button>
          `
        })}
      </div>

      ${allRoomsCleared && html`
        <button className="room-card room-card--boss" onClick=${() => goTo('boss')}>
          <div className="room-card__top">
            <span className="room-card__emoji">🚪</span>
            <div className="room-card__meta">
              <span className="room-card__subject">All three · Final puzzle</span>
              <h2 className="room-card__label">The Central Hall</h2>
            </div>
          </div>
          <p className="room-card__desc">
            The door at the end of the corridor. Three clues. One answer.
          </p>
        </button>
      `}
    </div>
  `
}
