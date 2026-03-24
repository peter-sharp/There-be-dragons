/**
 * tests/puzzles.test.js
 *
 * Validates the structure of all puzzle pools and static game data.
 * No rendering — pure data integrity checks.
 */

import { expect } from 'chai'
import {
  LIBRARY_POOL,
  ENGINE_POOL,
  SPECIMEN_POOL,
  BOSS_PUZZLE,
  ABILITY_CARDS,
} from '../src/data/puzzles.js'

// ── Helpers ───────────────────────────────────────────────

const ALL_POOLS = [LIBRARY_POOL, ENGINE_POOL, SPECIMEN_POOL]
const ALL_PUZZLES = ALL_POOLS.flat()

// ── Pool sizes ────────────────────────────────────────────

describe('LIBRARY_POOL', () => {
  it('has exactly 5 puzzles', () => {
    expect(LIBRARY_POOL).to.have.length(5)
  })

  it('all puzzles are type word-order', () => {
    LIBRARY_POOL.forEach(p => {
      expect(p.type).to.equal('word-order', `puzzle ${p.id} should be word-order`)
    })
  })

  it('each puzzle has a words array and answer string', () => {
    LIBRARY_POOL.forEach(p => {
      expect(p.words).to.be.an('array').with.length.greaterThan(0)
      expect(p.answer).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('answer can be reconstructed by joining words', () => {
    LIBRARY_POOL.forEach(p => {
      const allWords = p.words.join(' ')
      // The answer should use exactly the words provided (possibly in different order)
      p.answer.split(' ').forEach(word => {
        expect(p.words).to.include(word, `word "${word}" in answer must appear in words array for ${p.id}`)
      })
    })
  })

  it('exactly one puzzle produces a clue', () => {
    const clueMakers = LIBRARY_POOL.filter(p => p.producesClue)
    expect(clueMakers).to.have.length(1)
  })
})

describe('ENGINE_POOL', () => {
  it('has at least 3 puzzles', () => {
    expect(ENGINE_POOL.length).to.be.at.least(3)
  })

  it('all puzzles are type number-fill', () => {
    ENGINE_POOL.forEach(p => {
      expect(p.type).to.equal('number-fill', `puzzle ${p.id} should be number-fill`)
    })
  })

  it('each puzzle has template, numeric answer, and hint', () => {
    ENGINE_POOL.forEach(p => {
      expect(p.template).to.be.a('string').with.length.greaterThan(0)
      expect(p.answer).to.be.a('number')
      expect(p.hint).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('answers are positive integers', () => {
    ENGINE_POOL.forEach(p => {
      expect(p.answer).to.be.above(0)
      expect(Number.isInteger(p.answer)).to.be.true
    })
  })

  it('exactly one puzzle produces a clue', () => {
    const clueMakers = ENGINE_POOL.filter(p => p.producesClue)
    expect(clueMakers).to.have.length(1)
  })
})

describe('SPECIMEN_POOL', () => {
  it('has at least 3 puzzles', () => {
    expect(SPECIMEN_POOL.length).to.be.at.least(3)
  })

  it('all puzzles are type match', () => {
    SPECIMEN_POOL.forEach(p => {
      expect(p.type).to.equal('match', `puzzle ${p.id} should be match`)
    })
  })

  it('each puzzle has a pairs array', () => {
    SPECIMEN_POOL.forEach(p => {
      expect(p.pairs).to.be.an('array').with.length.greaterThan(1)
    })
  })

  it('each pair has item and match strings', () => {
    SPECIMEN_POOL.forEach(p => {
      p.pairs.forEach((pair, i) => {
        expect(pair.item).to.be.a('string').with.length.greaterThan(0,
          `pairs[${i}].item missing in ${p.id}`)
        expect(pair.match).to.be.a('string').with.length.greaterThan(0,
          `pairs[${i}].match missing in ${p.id}`)
      })
    })
  })

  it('exactly one puzzle produces a clue', () => {
    const clueMakers = SPECIMEN_POOL.filter(p => p.producesClue)
    expect(clueMakers).to.have.length(1)
  })
})

// ── Universal puzzle fields ───────────────────────────────

describe('All puzzles', () => {
  it('each has an id string', () => {
    ALL_PUZZLES.forEach(p => {
      expect(p.id).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('all IDs are unique across all pools', () => {
    const ids = ALL_PUZZLES.map(p => p.id)
    const unique = new Set(ids)
    expect(unique.size).to.equal(ids.length, 'Duplicate puzzle IDs found')
  })

  it('each has a context string', () => {
    ALL_PUZZLES.forEach(p => {
      expect(p.context).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('each has a flavour string', () => {
    ALL_PUZZLES.forEach(p => {
      expect(p.flavour).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('each has a dadReaction string', () => {
    ALL_PUZZLES.forEach(p => {
      expect(p.dadReaction).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('each has a kidReactions object', () => {
    ALL_PUZZLES.forEach(p => {
      expect(p.kidReactions).to.be.an('object')
    })
  })
})

// ── Boss puzzle ───────────────────────────────────────────

describe('BOSS_PUZZLE', () => {
  it('exists', () => {
    expect(BOSS_PUZZLE).to.be.an('object')
  })

  it('has id "boss"', () => {
    expect(BOSS_PUZZLE.id).to.equal('boss')
  })

  it('is type word-order', () => {
    expect(BOSS_PUZZLE.type).to.equal('word-order')
  })

  it('has the correct answer', () => {
    expect(BOSS_PUZZLE.answer).to.equal('They chose to stay')
  })

  it('words array joins to the answer', () => {
    expect(BOSS_PUZZLE.words.join(' ')).to.equal(BOSS_PUZZLE.answer)
  })

  it('has context and flavour', () => {
    expect(BOSS_PUZZLE.context).to.be.a('string').with.length.greaterThan(0)
    expect(BOSS_PUZZLE.flavour).to.be.a('string').with.length.greaterThan(0)
  })
})

// ── Ability cards ─────────────────────────────────────────

describe('ABILITY_CARDS', () => {
  it('has exactly 4 cards', () => {
    expect(ABILITY_CARDS).to.have.length(4)
  })

  it('each card has id, name, emoji, description', () => {
    ABILITY_CARDS.forEach(card => {
      expect(card.id).to.be.a('string').with.length.greaterThan(0)
      expect(card.name).to.be.a('string').with.length.greaterThan(0)
      expect(card.emoji).to.be.a('string').with.length.greaterThan(0)
      expect(card.description).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('all card IDs are unique', () => {
    const ids = ABILITY_CARDS.map(c => c.id)
    expect(new Set(ids).size).to.equal(ids.length)
  })

  it('includes the field-journal card for oldest kid', () => {
    const card = ABILITY_CARDS.find(c => c.id === 'field-journal')
    expect(card).to.exist
    expect(card.kidId).to.equal('oldest')
  })

  it('includes the pocket-calculator card for middle kid', () => {
    const card = ABILITY_CARDS.find(c => c.id === 'pocket-calculator')
    expect(card).to.exist
    expect(card.kidId).to.equal('middle')
  })

  it('includes the specimen-jar card for youngest kid', () => {
    const card = ABILITY_CARDS.find(c => c.id === 'specimen-jar')
    expect(card).to.exist
    expect(card.kidId).to.equal('youngest')
  })
})
