/**
 * tests/store.test.js
 *
 * Tests for all Zustand store slices: meta, run, and UI.
 *
 * Strategy: reset store state via useStore.setState() before each test,
 * then call actions via useStore.getState().action() and assert with getState().
 * No React rendering required — store actions are plain JS.
 */

import { expect } from 'chai'
import { useStore, STARTING_TORCHES, ROOM_DEFS } from '../src/store.js'

// ── Helpers ───────────────────────────────────────────────

const CLEAN_STATE = {
  // meta
  namesSet: false,
  kidNames: { oldest: 'Sam', middle: 'Alex', youngest: 'Pip' },
  totalRuns: 0,
  // run
  active: false,
  torches: STARTING_TORCHES,
  roomsCleared: [],
  cluesFound: {},
  abilityCards: [],
  seed: 0,
  // ui
  screen: 'hub',
  activeRoom: null,
}

function resetStore() {
  useStore.setState(CLEAN_STATE)
}

function s() {
  return useStore.getState()
}

// ── Meta slice ────────────────────────────────────────────

describe('Store — meta slice', () => {
  beforeEach(resetStore)

  it('has correct default kid names', () => {
    expect(s().kidNames.oldest).to.equal('Sam')
    expect(s().kidNames.middle).to.equal('Alex')
    expect(s().kidNames.youngest).to.equal('Pip')
  })

  it('setKidNames updates all names at once', () => {
    s().setKidNames({ oldest: 'Jo', middle: 'Max', youngest: 'Bea' })
    expect(s().kidNames).to.deep.equal({ oldest: 'Jo', middle: 'Max', youngest: 'Bea' })
  })

  it('setKidNames sets namesSet to true', () => {
    expect(s().namesSet).to.be.false
    s().setKidNames({ oldest: 'Jo', middle: 'Max', youngest: 'Bea' })
    expect(s().namesSet).to.be.true
  })

  it('incrementRuns increases totalRuns by 1', () => {
    expect(s().totalRuns).to.equal(0)
    s().incrementRuns()
    expect(s().totalRuns).to.equal(1)
    s().incrementRuns()
    expect(s().totalRuns).to.equal(2)
  })
})

// ── Run slice — lifecycle ─────────────────────────────────

describe('Store — startRun', () => {
  beforeEach(resetStore)

  it('sets active to true', () => {
    expect(s().active).to.be.false
    s().startRun()
    expect(s().active).to.be.true
  })

  it('resets torches to STARTING_TORCHES', () => {
    useStore.setState({ torches: 2 })
    s().startRun()
    expect(s().torches).to.equal(STARTING_TORCHES)
  })

  it('clears roomsCleared', () => {
    useStore.setState({ roomsCleared: ['library', 'engine'] })
    s().startRun()
    expect(s().roomsCleared).to.deep.equal([])
  })

  it('clears cluesFound', () => {
    useStore.setState({ cluesFound: { library: 'some clue' } })
    s().startRun()
    expect(s().cluesFound).to.deep.equal({})
  })

  it('clears abilityCards', () => {
    useStore.setState({ abilityCards: [{ id: 'test-card' }] })
    s().startRun()
    expect(s().abilityCards).to.deep.equal([])
  })

  it('generates a numeric seed', () => {
    s().startRun()
    expect(s().seed).to.be.a('number')
  })

  it('increments totalRuns', () => {
    expect(s().totalRuns).to.equal(0)
    s().startRun()
    expect(s().totalRuns).to.equal(1)
  })

  it('each startRun produces a different seed (with very high probability)', () => {
    s().startRun()
    const seed1 = s().seed
    s().startRun()
    const seed2 = s().seed
    // Seeds are random — probability of collision is 1/2^32
    expect(seed1).to.not.equal(seed2)
  })
})

describe('Store — endRun', () => {
  beforeEach(resetStore)

  it('sets active to false', () => {
    useStore.setState({ active: true })
    s().endRun()
    expect(s().active).to.be.false
  })
})

// ── Run slice — torches ───────────────────────────────────

describe('Store — torch management', () => {
  beforeEach(resetStore)

  it('spendTorch decrements torches by 1', () => {
    useStore.setState({ torches: 3 })
    s().spendTorch()
    expect(s().torches).to.equal(2)
  })

  it('spendTorch returns false when torches remain', () => {
    useStore.setState({ torches: 3 })
    const dead = s().spendTorch()
    expect(dead).to.be.false
  })

  it('spendTorch returns true when torches reach 0', () => {
    useStore.setState({ torches: 1 })
    const dead = s().spendTorch()
    expect(dead).to.be.true
    expect(s().torches).to.equal(0)
  })

  it('spendTorch returns true when torches go below 0 (already at 0)', () => {
    useStore.setState({ torches: 0 })
    const dead = s().spendTorch()
    expect(dead).to.be.true
  })

  it('gainTorch adds 1 torch by default', () => {
    useStore.setState({ torches: 3 })
    s().gainTorch()
    expect(s().torches).to.equal(4)
  })

  it('gainTorch adds the specified amount', () => {
    useStore.setState({ torches: 2 })
    s().gainTorch(3)
    expect(s().torches).to.equal(5)
  })
})

// ── Run slice — rooms ─────────────────────────────────────

describe('Store — room management', () => {
  beforeEach(resetStore)

  it('clearRoom adds room id to roomsCleared', () => {
    s().clearRoom('library')
    expect(s().roomsCleared).to.include('library')
  })

  it('clearRoom awards +1 torch', () => {
    const before = s().torches
    s().clearRoom('library')
    expect(s().torches).to.equal(before + 1)
  })

  it('clearRoom is idempotent — duplicate id not added', () => {
    s().clearRoom('library')
    s().clearRoom('library')
    expect(s().roomsCleared.filter(id => id === 'library')).to.have.length(1)
  })

  it('can clear multiple different rooms', () => {
    s().clearRoom('library')
    s().clearRoom('engine')
    s().clearRoom('specimens')
    expect(s().roomsCleared).to.have.length(3)
    expect(s().roomsCleared).to.include.members(['library', 'engine', 'specimens'])
  })

  it('storeClue saves clue under the given roomId', () => {
    s().storeClue('library', 'Lock the doors and do not')
    expect(s().cluesFound.library).to.equal('Lock the doors and do not')
  })

  it('storeClue can store clues for multiple rooms', () => {
    s().storeClue('library', 'clue-1')
    s().storeClue('engine', 'clue-2')
    expect(s().cluesFound).to.deep.equal({ library: 'clue-1', engine: 'clue-2' })
  })

  it('storeClue overwrites an existing clue for the same room', () => {
    s().storeClue('library', 'first')
    s().storeClue('library', 'second')
    expect(s().cluesFound.library).to.equal('second')
  })
})

// ── Run slice — ability cards ─────────────────────────────

describe('Store — ability cards', () => {
  beforeEach(resetStore)

  const mockCard = { id: 'field-journal', name: 'Field Journal', emoji: '📓' }

  it('addAbilityCard appends card to abilityCards', () => {
    s().addAbilityCard(mockCard)
    expect(s().abilityCards).to.have.length(1)
    expect(s().abilityCards[0].id).to.equal('field-journal')
  })

  it('addAbilityCard allows multiple cards', () => {
    s().addAbilityCard({ id: 'card-a' })
    s().addAbilityCard({ id: 'card-b' })
    expect(s().abilityCards).to.have.length(2)
  })

  it('useAbilityCard removes the card with matching id', () => {
    s().addAbilityCard({ id: 'card-a' })
    s().addAbilityCard({ id: 'card-b' })
    s().useAbilityCard('card-a')
    expect(s().abilityCards.map(c => c.id)).to.deep.equal(['card-b'])
  })

  it('useAbilityCard is a no-op for unknown id', () => {
    s().addAbilityCard(mockCard)
    s().useAbilityCard('nonexistent')
    expect(s().abilityCards).to.have.length(1)
  })

  it('using a card does not affect other cards', () => {
    s().addAbilityCard({ id: 'keep-1' })
    s().addAbilityCard({ id: 'remove' })
    s().addAbilityCard({ id: 'keep-2' })
    s().useAbilityCard('remove')
    expect(s().abilityCards.map(c => c.id)).to.deep.equal(['keep-1', 'keep-2'])
  })
})

// ── UI slice ──────────────────────────────────────────────

describe('Store — UI / navigation', () => {
  beforeEach(resetStore)

  it('default screen is hub', () => {
    expect(s().screen).to.equal('hub')
  })

  it('goTo updates screen', () => {
    s().goTo('boss')
    expect(s().screen).to.equal('boss')
  })

  it('goTo sets activeRoom to null by default', () => {
    s().goTo('hub')
    expect(s().activeRoom).to.be.null
  })

  it('goTo can set activeRoom as second argument', () => {
    s().goTo('room', 'library')
    expect(s().screen).to.equal('room')
    expect(s().activeRoom).to.equal('library')
  })

  it('enterRoom sets screen to room and updates activeRoom', () => {
    s().enterRoom('engine')
    expect(s().screen).to.equal('room')
    expect(s().activeRoom).to.equal('engine')
  })

  it('enterRoom works for all valid room IDs', () => {
    const roomIds = Object.keys(ROOM_DEFS)
    roomIds.forEach(id => {
      s().enterRoom(id)
      expect(s().screen).to.equal('room')
      expect(s().activeRoom).to.equal(id)
    })
  })

  it('goToHub sets screen to hub', () => {
    s().enterRoom('library')
    s().goToHub()
    expect(s().screen).to.equal('hub')
  })

  it('goToHub clears activeRoom', () => {
    s().enterRoom('library')
    s().goToHub()
    expect(s().activeRoom).to.be.null
  })

  it('goTo dead navigates to dead screen', () => {
    s().goTo('dead')
    expect(s().screen).to.equal('dead')
  })

  it('goTo win navigates to win screen', () => {
    s().goTo('win')
    expect(s().screen).to.equal('win')
  })
})

// ── Integration — full run lifecycle ─────────────────────

describe('Store — run lifecycle integration', () => {
  beforeEach(resetStore)

  it('full happy path: start → clear rooms → lose torch → clue', () => {
    s().startRun()
    expect(s().active).to.be.true
    expect(s().torches).to.equal(STARTING_TORCHES)

    // Enter and clear library
    s().enterRoom('library')
    expect(s().screen).to.equal('room')

    s().storeClue('library', 'Lock the doors and do not')
    s().clearRoom('library')
    expect(s().roomsCleared).to.include('library')
    expect(s().torches).to.equal(STARTING_TORCHES + 1)

    // Spend a torch for a wrong answer
    const dead = s().spendTorch()
    expect(dead).to.be.false
    expect(s().torches).to.equal(STARTING_TORCHES)

    // Clue stored
    expect(s().cluesFound.library).to.equal('Lock the doors and do not')
  })

  it('permadeath: spending last torch returns true', () => {
    s().startRun()
    useStore.setState({ torches: 1 })
    const dead = s().spendTorch()
    expect(dead).to.be.true
    expect(s().torches).to.equal(0)
  })

  it('win flow: clear all rooms, navigate to boss then win', () => {
    s().startRun()
    ;['library', 'engine', 'specimens'].forEach(id => s().clearRoom(id))
    expect(s().roomsCleared).to.have.length(3)

    s().goTo('boss')
    expect(s().screen).to.equal('boss')

    s().goTo('win')
    expect(s().screen).to.equal('win')
  })
})
