import { createElement, useState } from 'react'
import htm from 'htm'

const html = htm.bind(createElement)

/**
 * MatchPuzzle — match items to their descriptions
 * Stub — tap an item then tap its match.
 *
 * @param {{
 *   puzzle: { context: string, flavour: string, pairs: Array<{item: string, match: string}> },
 *   onSolved: (answer: string) => void,
 *   onWrong: () => void,
 * }} props
 */
export default function MatchPuzzle({ puzzle, onSolved, onWrong }) {
  const [selected, setSelected] = useState(null)   // item side
  const [matched, setMatched]   = useState({})      // item → match
  const [feedback, setFeedback] = useState('idle')

  const items   = puzzle.pairs.map(p => p.item)
  const matches = puzzle.pairs.map(p => p.match)

  const handleItem = item => {
    setSelected(item)
    setFeedback('idle')
  }

  const handleMatch = match => {
    if (!selected) return
    const correct = puzzle.pairs.find(p => p.item === selected)?.match
    if (match === correct) {
      const next = { ...matched, [selected]: match }
      setMatched(next)
      setSelected(null)
      if (Object.keys(next).length === puzzle.pairs.length) {
        onSolved(Object.keys(next).join(', '))
      }
    } else {
      setFeedback('wrong')
      setSelected(null)
      onWrong()
    }
  }

  return html`
    <div className="puzzle match-puzzle">
      <div className="level__journal">
        <p className="level__journal-date">${puzzle.context}</p>
        <p className="level__flavour">${puzzle.flavour}</p>
      </div>

      <div className="match-puzzle__columns">
        <div className="match-puzzle__col">
          ${items.map(item =>
            html`<button
              key=${item}
              className=${['match-chip', matched[item] ? 'match-chip--matched' : '', selected === item ? 'match-chip--selected' : ''].join(' ')}
              onClick=${() => !matched[item] && handleItem(item)}
              disabled=${!!matched[item]}
            >${item}</button>`
          )}
        </div>

        <div className="match-puzzle__col">
          ${matches.map(match =>
            html`<button
              key=${match}
              className=${['match-chip', Object.values(matched).includes(match) ? 'match-chip--matched' : ''].join(' ')}
              onClick=${() => handleMatch(match)}
              disabled=${Object.values(matched).includes(match)}
            >${match}</button>`
          )}
        </div>
      </div>

      ${selected && html`
        <p className="match-puzzle__prompt">Now tap what matches: "${selected}"</p>
      `}

      ${feedback === 'wrong' && html`
        <p className="level__feedback level__feedback--wrong">
          ✗ That's not a match. (−1 torch)
        </p>
      `}
    </div>
  `
}
