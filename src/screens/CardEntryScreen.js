/**
 * CardEntryScreen.js — Flashcard entry form + CSV import
 */

import { createElement as h, useState, useRef } from 'react'
import htm from 'htm'
import { useStore } from '../store.js'
import { CardForm } from '../components/CardForm.js'

const html = htm.bind(h)

export function CardEntryScreen() {
  const cards = useStore(s => s.cards)
  const removeCard = useStore(s => s.removeCard)
  const importCSV = useStore(s => s.importCSV)
  const clearDeck = useStore(s => s.clearDeck)
  const generateGame = useStore(s => s.generateGame)
  const goTo = useStore(s => s.goTo)
  const fileRef = useRef(null)
  const [editingId, setEditingId] = useState(null)

  const canGenerate = cards.length >= 4

  const handleGenerate = () => {
    generateGame()
    goTo('game')
  }

  const handleImport = () => {
    fileRef.current?.click()
  }

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      importCSV(ev.target.result)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return html`
    <div class="screen card-entry-screen">
      <h2>Prepare Your Flashcards</h2>
      <p class="subtitle">Enter at least 4 cards to generate the game.</p>

      <${CardForm} key="new" editingId=${editingId} setEditingId=${setEditingId} />

      <div class="card-list">
        ${cards.map(card => html`
          <div class="card-item" key=${card.id}>
            <div class="card-content">
              <strong>${card.front}</strong>
              <span class="card-arrow">→</span>
              <span>${card.back}</span>
              ${card.redHerrings.length > 0 && html`
                <span class="card-herrings">
                  (${card.redHerrings.length} red herring${card.redHerrings.length > 1 ? 's' : ''})
                </span>
              `}
              ${card.repeats > 1 && html`
                <span class="card-repeats">×${card.repeats}</span>
              `}
            </div>
            <div class="card-actions">
              <button class="btn-small" onClick=${() => setEditingId(card.id)}>Edit</button>
              <button class="btn-small btn-danger" onClick=${() => removeCard(card.id)}>×</button>
            </div>
          </div>
        `)}
      </div>

      <div class="card-entry-actions">
        <button class="btn-secondary" onClick=${handleImport}>
          Import CSV
        </button>
        <input
          type="file"
          ref=${fileRef}
          accept=".csv"
          style=${{ display: 'none' }}
          onChange=${handleFileChange}
        />
        ${cards.length > 0 && html`
          <button class="btn-secondary btn-danger" onClick=${clearDeck}>
            Clear All
          </button>
        `}
      </div>

      <button
        class="btn-primary"
        disabled=${!canGenerate}
        onClick=${handleGenerate}
      >
        ${canGenerate
          ? `Generate Game (${cards.length} cards)`
          : `Need ${4 - cards.length} more card${4 - cards.length > 1 ? 's' : ''}`
        }
      </button>

      <button class="btn-link" onClick=${() => goTo('title')}>
        ← Back
      </button>
    </div>
  `
}
