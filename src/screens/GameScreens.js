import { createElement } from 'react'
import htm from 'htm'
import { useStore, KID_DEFS } from '../store.js'
import { BOSS_PUZZLE } from '../data/puzzles.js'
import WordOrderPuzzle from '../components/WordOrderPuzzle.js'

const html = htm.bind(createElement)

// ─────────────────────────────────────────────────────────
// DeadScreen — permadeath, torches hit 0
// ─────────────────────────────────────────────────────────

export function DeadScreen() {
  const kidNames  = useStore(s => s.kidNames)
  const totalRuns = useStore(s => s.totalRuns)
  const startRun  = useStore(s => s.startRun)
  const goToHub   = useStore(s => s.goToHub)

  const handleRetry = () => {
    startRun()
    goToHub()
  }

  return html`
    <div className="screen dead-screen">
      <div className="dead-screen__content">
        <p className="dead-screen__icon">🔦</p>
        <h1 className="dead-screen__title">The lights went out.</h1>
        <p className="dead-screen__flavour">
          ${`${kidNames.oldest}, ${kidNames.middle}, and ${kidNames.youngest} `}stood in the dark. The jungle sounds got closer.
        </p>
        <div className="dead-screen__dad">
          <span>🧑‍🦳</span>
          <p>"No shame in it. The 1912 team probably made the same mistakes. Get some rest and we'll try again."</p>
        </div>
        ${totalRuns > 1 && html`
          <p className="dead-screen__runs">${`Run #${totalRuns} ended. The mystery remains.`}</p>
        `}
        <button className="btn btn--primary btn--full" onClick=${handleRetry}>
          Try Again →
        </button>
      </div>
    </div>
  `
}

// ─────────────────────────────────────────────────────────
// AbilityCardScreen — special moment card reveal
// ─────────────────────────────────────────────────────────

export function AbilityCardScreen() {
  const abilityCards = useStore(s => s.abilityCards)
  const kidNames     = useStore(s => s.kidNames)
  const goToHub      = useStore(s => s.goToHub)

  // Show the most recently added card
  const card = abilityCards[abilityCards.length - 1]
  if (!card) { goToHub(); return null }

  const kidName = card.kidId ? kidNames[card.kidId] : null

  return html`
    <div className="screen ability-screen">
      <div className="ability-screen__card">
        <p className="ability-screen__found">
          ${kidName ? `${kidName} found something useful...` : 'The family found something...'}
        </p>
        <div className="ability-card">
          <span className="ability-card__emoji">${card.emoji}</span>
          <h2 className="ability-card__name">${card.name}</h2>
          <p className="ability-card__desc">${card.description}</p>
        </div>
        <div className="ability-screen__dad">
          <span>🧑‍🦳</span>
          <p>"Hold on to that. You'll know when to use it."</p>
        </div>
        <button className="btn btn--primary btn--full" onClick=${goToHub}>
          Back to the Station →
        </button>
      </div>
    </div>
  `
}

// ─────────────────────────────────────────────────────────
// BossScreen — final combined puzzle
// ─────────────────────────────────────────────────────────

export function BossScreen() {
  const kidNames   = useStore(s => s.kidNames)
  const cluesFound = useStore(s => s.cluesFound)
  const spendTorch = useStore(s => s.spendTorch)
  const endRun     = useStore(s => s.endRun)
  const goTo       = useStore(s => s.goTo)

  const handleSolved = () => goTo('win')

  const handleWrong = () => {
    const dead = spendTorch()
    if (dead) goTo('dead')
  }

  return html`
    <div className="screen boss-screen">
      <div className="level__header">
        <span className="level__progress">Final puzzle</span>
        <h2 className="level__title">🚪 The Central Hall</h2>
      </div>

      <div className="hub__dad">
        <span className="hub__dad-icon">🧑‍🦳</span>
        <p className="hub__dad-text">
          ${`"Everything you've found leads here. ${kidNames.oldest}, ${kidNames.middle}, ${kidNames.youngest} — put it together."`}
        </p>
      </div>

      ${Object.entries(cluesFound).length > 0 && html`
        <div className="boss__clues">
          <p className="boss__clues-label">Your clues:</p>
          ${Object.entries(cluesFound).map(([roomId, clue]) =>
            html`
              <div key=${roomId} className="boss__clue">
                <span>📌</span>
                <span>${clue}</span>
              </div>
            `
          )}
        </div>
      `}

      <${WordOrderPuzzle} puzzle=${BOSS_PUZZLE} onSolved=${handleSolved} onWrong=${handleWrong} />
    </div>
  `
}

// ─────────────────────────────────────────────────────────
// WinScreen — mystery solved
// ─────────────────────────────────────────────────────────

export function WinScreen() {
  const kidNames  = useStore(s => s.kidNames)
  const totalRuns = useStore(s => s.totalRuns)
  const startRun  = useStore(s => s.startRun)
  const goToHub   = useStore(s => s.goToHub)

  const handlePlayAgain = () => {
    startRun()
    goToHub()
  }

  return html`
    <div className="screen win-screen">
      <div className="win-screen__content">
        <p className="win-screen__icon">🦕</p>
        <h1 className="win-screen__title">Mystery Solved.</h1>
        <p className="win-screen__flavour">
          ${`${kidNames.oldest}, ${kidNames.middle}, and ${kidNames.youngest} stood in the central hall `}as the truth settled over them like dust from the 1912 shelves.
        </p>
        <div className="win-screen__dad">
          <span>🧑‍🦳</span>
          <p>"They chose to stay." *long pause* "I think I understand why."</p>
        </div>
        <p className="win-screen__runs">${`Solved on run #${totalRuns}.`}</p>
        <button className="btn btn--primary btn--full" onClick=${handlePlayAgain}>
          Play Again →
        </button>
      </div>
    </div>
  `
}
