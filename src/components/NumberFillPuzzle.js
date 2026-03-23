import { createElement, useState } from 'react'
import htm from 'htm'

const html = htm.bind(createElement)

/**
 * NumberFillPuzzle — fill in the missing number
 * Stub implementation — expand with proper UI for maths room.
 *
 * @param {{
 *   puzzle: { context: string, flavour: string, template: string, answer: number, hint: string },
 *   onSolved: (answer: string) => void,
 *   onWrong: () => void,
 * }} props
 */
export default function NumberFillPuzzle({ puzzle, onSolved, onWrong }) {
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('idle')

  const check = () => {
    if (parseInt(value, 10) === puzzle.answer) {
      onSolved(String(puzzle.answer))
    } else {
      setFeedback('wrong')
      onWrong()
    }
  }

  return html`
    <div className="puzzle number-fill-puzzle">
      <div className="level__journal">
        <p className="level__journal-date">${puzzle.context}</p>
        <p className="level__flavour">${puzzle.flavour}</p>
      </div>

      <p className="number-fill__template">${puzzle.template}</p>
      <p className="number-fill__hint">${`💡 ${puzzle.hint}`}</p>

      <input
        className="number-fill__input"
        type="number"
        value=${value}
        placeholder="?"
        aria-label="Your answer"
        onChange=${e => { setValue(e.target.value); setFeedback('idle') }}
        onKeyDown=${e => e.key === 'Enter' && value && check()}
      />

      ${feedback === 'wrong' && html`
        <p className="level__feedback level__feedback--wrong">
          ✗ Not right — check the hint. (−1 torch)
        </p>
      `}

      <div className="level__actions">
        <button
          className="btn btn--primary"
          onClick=${check}
          disabled=${!value}
        >Submit</button>
      </div>
    </div>
  `
}
