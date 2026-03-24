/**
 * CardForm.js — Single flashcard entry/edit form
 */

import { createElement as h, useState, useEffect } from 'react'
import htm from 'htm'
import { useStore } from '../store.js'

const html = htm.bind(h)

export function CardForm({ editingId, setEditingId }) {
  const cards = useStore(s => s.cards)
  const addCard = useStore(s => s.addCard)
  const updateCard = useStore(s => s.updateCard)

  const editingCard = editingId ? cards.find(c => c.id === editingId) : null

  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [herrings, setHerrings] = useState(['', '', '', ''])
  const [repeats, setRepeats] = useState(1)

  useEffect(() => {
    if (editingCard) {
      setFront(editingCard.front)
      setBack(editingCard.back)
      const h = [...editingCard.redHerrings]
      while (h.length < 4) h.push('')
      setHerrings(h)
      setRepeats(editingCard.repeats)
    }
  }, [editingId])

  const reset = () => {
    setFront('')
    setBack('')
    setHerrings(['', '', '', ''])
    setRepeats(1)
    setEditingId(null)
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!front.trim() || !back.trim()) return

    const data = {
      front: front.trim(),
      back: back.trim(),
      redHerrings: herrings.filter(h => h.trim()),
      repeats,
    }

    if (editingId) {
      updateCard(editingId, data)
    } else {
      addCard(data)
    }
    reset()
  }

  const setHerring = (i, val) => {
    const next = [...herrings]
    next[i] = val
    setHerrings(next)
  }

  return html`
    <form class="card-form" onSubmit=${handleSubmit}>
      <div class="form-row">
        <label>
          <span>Term (front)</span>
          <input
            type="text"
            value=${front}
            onInput=${e => setFront(e.target.value)}
            placeholder="e.g. Photosynthesis"
            required
          />
        </label>
        <label>
          <span>Definition (back)</span>
          <input
            type="text"
            value=${back}
            onInput=${e => setBack(e.target.value)}
            placeholder="e.g. Process plants use to make food"
            required
          />
        </label>
      </div>

      <details class="herrings-section">
        <summary>Red Herrings (optional)</summary>
        <div class="form-row herrings-row">
          ${herrings.map((h, i) => html`
            <input
              key=${i}
              type="text"
              value=${h}
              onInput=${e => setHerring(i, e.target.value)}
              placeholder=${`Wrong answer ${i + 1}`}
            />
          `)}
        </div>
      </details>

      <div class="form-row form-footer">
        <label class="repeats-label">
          <span>Repeats</span>
          <input
            type="number"
            min="1"
            max="5"
            value=${repeats}
            onInput=${e => setRepeats(parseInt(e.target.value) || 1)}
          />
        </label>
        <div class="form-buttons">
          ${editingId && html`
            <button type="button" class="btn-secondary" onClick=${reset}>
              Cancel
            </button>
          `}
          <button type="submit" class="btn-primary btn-small">
            ${editingId ? 'Update' : 'Add Card'}
          </button>
        </div>
      </div>
    </form>
  `
}
