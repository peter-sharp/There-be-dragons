import { createElement, useState, useMemo } from 'react'
import htm from 'htm'
import { useStore, KID_DEFS, ROOM_DEFS, makeRng, seededShuffle } from '../store.js'
import { LIBRARY_POOL, ENGINE_POOL, SPECIMEN_POOL, ABILITY_CARDS } from '../data/puzzles.js'
import WordOrderPuzzle from '../components/WordOrderPuzzle.js'
import NumberFillPuzzle from '../components/NumberFillPuzzle.js'
import MatchPuzzle from '../components/MatchPuzzle.js'
import RoomSVG from '../components/RoomSVG.js'

const html = htm.bind(createElement)

const POOL_BY_ROOM = {
  library:   LIBRARY_POOL,
  engine:    ENGINE_POOL,
  specimens: SPECIMEN_POOL,
}

// Rooms that award an ability card on first clear (special moments only)
const ABILITY_CARD_ROOMS = {
  library:   ABILITY_CARDS.find(c => c.id === 'field-journal'),
  engine:    ABILITY_CARDS.find(c => c.id === 'pocket-calculator'),
  specimens: ABILITY_CARDS.find(c => c.id === 'specimen-jar'),
}

/**
 * RoomScreen
 *
 * Manages the puzzle chain for one room:
 *   1. Draws 3 puzzles from the room's pool (seeded random)
 *   2. Renders the appropriate puzzle component per type
 *   3. Tracks wrong answers → spends torches → checks permadeath
 *   4. Shows kid/dad reactions after correct answers
 *   5. Awards ability card on first clear (if applicable)
 *   6. Stores the final clue and marks room cleared
 */
export default function RoomScreen() {
  const activeRoom    = useStore(s => s.activeRoom)
  const seed          = useStore(s => s.seed)
  const kidNames      = useStore(s => s.kidNames)
  const roomsCleared  = useStore(s => s.roomsCleared)
  const abilityCards  = useStore(s => s.abilityCards)
  const spendTorch    = useStore(s => s.spendTorch)
  const clearRoom     = useStore(s => s.clearRoom)
  const storeClue     = useStore(s => s.storeClue)
  const addAbilityCard = useStore(s => s.addAbilityCard)
  const goToHub       = useStore(s => s.goToHub)
  const goTo          = useStore(s => s.goTo)

  const room = ROOM_DEFS[activeRoom]
  const kid  = KID_DEFS.find(k => k.id === room.kidId)
  const name = kidNames[kid.id]

  // Draw 3 puzzles using run seed — deterministic per run
  const puzzles = useMemo(() => {
    const pool = POOL_BY_ROOM[activeRoom]
    const rng  = makeRng(seed + activeRoom.charCodeAt(0))
    return seededShuffle(pool, rng).slice(0, 3)
  }, [activeRoom, seed])

  const [puzzleIdx, setPuzzleIdx]     = useState(0)
  const [phase, setPhase]             = useState('puzzle') // 'puzzle' | 'reaction' | 'complete'
  const [lastAnswer, setLastAnswer]   = useState('')
  const [prevAnswer, setPrevAnswer]   = useState('') // for escape-room chaining

  const puzzle = puzzles[puzzleIdx]
  const isLast = puzzleIdx === puzzles.length - 1
  const alreadyCleared = roomsCleared.includes(activeRoom)

  // ── Puzzle solved ────────────────────────────────────────
  const handleSolved = answer => {
    setLastAnswer(answer)
    if (isLast) {
      // Final puzzle — store clue, mark room cleared
      if (puzzle.producesClue) storeClue(activeRoom, answer)
      clearRoom(activeRoom) // also awards +1 torch
      setPhase('reaction')
    } else {
      setPrevAnswer(answer)
      setPhase('reaction')
    }
  }

  // ── Wrong answer ─────────────────────────────────────────
  const handleWrong = () => {
    const dead = spendTorch()
    if (dead) goTo('dead')
  }

  // ── After reaction, advance ───────────────────────────────
  const handleNext = () => {
    if (isLast) {
      // Check if this room awards an ability card (first clear only)
      const card = ABILITY_CARD_ROOMS[activeRoom]
      if (card && !alreadyCleared && !abilityCards.find(c => c.id === card.id)) {
        addAbilityCard(card)
        goTo('ability-card')
      } else {
        goToHub()
      }
    } else {
      setPuzzleIdx(i => i + 1)
      setPhase('puzzle')
    }
  }

  // ── Render puzzle by type ────────────────────────────────
  const renderPuzzle = () => {
    // Inject previous answer into flavour if puzzle uses it
    const flavour = puzzle.usesClueFrom === 'prev' && prevAnswer
      ? puzzle.flavour.replace('{clue}', prevAnswer)
      : puzzle.flavour

    const commonProps = {
      puzzle: { ...puzzle, flavour },
      onSolved: handleSolved,
      onWrong: handleWrong,
    }

    switch (puzzle.type) {
      case 'word-order':  return html`<${WordOrderPuzzle} ...${commonProps} />`
      case 'number-fill': return html`<${NumberFillPuzzle} ...${commonProps} />`
      case 'match':       return html`<${MatchPuzzle} ...${commonProps} />`
      default: return html`<p>Unknown puzzle type: ${puzzle.type}</p>`
    }
  }

  return html`
    <div className="screen room-screen">

      <div className="level__header">
        <span className="level__progress">${`Puzzle ${puzzleIdx + 1} of ${puzzles.length}`}</span>
        <h2 className="level__title">${`${room.emoji} ${room.label}`}</h2>
      </div>

      <div className="room__scene">
        <${RoomSVG} roomId=${activeRoom} />
      </div>

      <div className="room__kid-badge">
        <span className="room__kid-emoji">${kid.emoji}</span>
        <span className="room__kid-name">${`${name} (${kid.age}) is on this one`}</span>
      </div>

      ${phase === 'puzzle'
        ? renderPuzzle()
        : html`
          <div className="reaction-panel">
            <div className="level__journal">
              <p className="level__journal-date">${puzzle.context}</p>
              <p className="level__flavour">${`"${lastAnswer}"`}</p>
            </div>

            <div className="level__dad-reaction">
              <span className="level__dad-icon">🧑‍🦳</span>
              <p className="level__dad-text">${puzzle.dadReaction}</p>
            </div>

            ${Object.entries(puzzle.kidReactions || {}).map(([kidId, line]) =>
              html`
                <div key=${kidId} className="level__kid-reaction">
                  <span>${KID_DEFS.find(k => k.id === kidId).emoji}</span>
                  <p>${`${kidNames[kidId]}: ${line}`}</p>
                </div>
              `
            )}

            ${isLast && html`<p className="room__cleared">${`✓ ${name} has figured out this room.`}</p>`}

            <div className="level__actions">
              <button className="btn btn--primary" onClick=${handleNext}>
                ${isLast ? 'Leave the room →' : 'Next →'}
              </button>
            </div>
          </div>
        `}
    </div>
  `
}
