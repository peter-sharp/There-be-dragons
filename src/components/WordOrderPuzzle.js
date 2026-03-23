import { createElement, useState } from 'react'
import htm from 'htm'

const html = htm.bind(createElement)

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5)

/**
 * WordOrderPuzzle
 * Tap words from the bank to build the correct sentence.
 * Calls onSolved(answer) on correct, onWrong() on incorrect.
 *
 * @param {{
 *   puzzle: { context: string, flavour: string, words: string[], answer: string },
 *   onSolved: (answer: string) => void,
 *   onWrong: () => void,
 * }} props
 */
export default function WordOrderPuzzle({ puzzle, onSolved, onWrong }) {
  const [bank, setBank]       = useState(() => shuffle(puzzle.words))
  const [placed, setPlaced]   = useState([])
  const [feedback, setFeedback] = useState('idle') // 'idle' | 'wrong'

  const moveToPlaced = word => {
    setBank(b => b.filter(w => w !== word))
    setPlaced(p => [...p, word])
    setFeedback('idle')
  }

  const moveToBank = word => {
    setPlaced(p => p.filter(w => w !== word))
    setBank(b => [...b, word])
    setFeedback('idle')
  }

  const check = () => {
    const attempt = placed.join(' ')
    if (attempt === puzzle.answer) {
      onSolved(attempt)
    } else {
      setFeedback('wrong')
      onWrong()
    }
  }

  return html`
    <div className="puzzle word-order-puzzle">
      <div className="level__journal">
        <p className="level__journal-date">${puzzle.context}</p>
        <p className="level__flavour">${puzzle.flavour}</p>
      </div>

      <div className="word-tray word-tray--answer" aria-label="Your answer">
        ${placed.length === 0
          ? html`<span className="word-tray__placeholder">Tap words below to reconstruct the entry...</span>`
          : placed.map((word, i) =>
              html`<button key=${i} className="word-chip word-chip--placed" onClick=${() => moveToBank(word)}>${word}</button>`
            )}
      </div>

      <div className="word-tray word-tray--bank" aria-label="Available words">
        ${bank.map((word, i) =>
          html`<button key=${i} className="word-chip" onClick=${() => moveToPlaced(word)}>${word}</button>`
        )}
      </div>

      ${feedback === 'wrong' && html`
        <p className="level__feedback level__feedback--wrong">
          ✗ Not quite right — try a different order. (−1 torch)
        </p>
      `}

      <div className="level__actions">
        <button
          className="btn btn--primary"
          onClick=${check}
          disabled=${placed.length !== puzzle.words.length}
        >Decipher</button>
      </div>
    </div>
  `
}
