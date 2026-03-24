/**
 * tests/room-svg.test.js
 *
 * Tests for the RoomSVG component — verifies correct SVG structure,
 * room-specific emoji items, and graceful handling of invalid room IDs.
 */

import { expect } from 'chai'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import RoomSVG from '../src/components/RoomSVG.js'

// ── Render helper ─────────────────────────────────────────

let container
let root

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => { root.unmount() })
  document.body.removeChild(container)
  container = null
  root = null
})

async function renderRoom(roomId) {
  await act(async () => {
    root.render(createElement(RoomSVG, { roomId }))
  })
  return container
}

// ── Basic SVG structure ───────────────────────────────────

describe('RoomSVG — structure', () => {
  it('renders an SVG element for "library"', async () => {
    const c = await renderRoom('library')
    const svg = c.querySelector('svg')
    expect(svg).to.not.be.null
  })

  it('renders an SVG element for "engine"', async () => {
    const c = await renderRoom('engine')
    expect(c.querySelector('svg')).to.not.be.null
  })

  it('renders an SVG element for "specimens"', async () => {
    const c = await renderRoom('specimens')
    expect(c.querySelector('svg')).to.not.be.null
  })

  it('SVG has viewBox attribute', async () => {
    const c = await renderRoom('library')
    const svg = c.querySelector('svg')
    expect(svg.getAttribute('viewBox')).to.equal('0 0 320 160')
  })

  it('SVG has the data-room attribute matching the roomId', async () => {
    for (const id of ['library', 'engine', 'specimens']) {
      const c = await renderRoom(id)
      const svg = c.querySelector('svg')
      expect(svg.getAttribute('data-room')).to.equal(id)
    }
  })

  it('renders polygon elements (low-poly tiles)', async () => {
    const c = await renderRoom('library')
    const polygons = c.querySelectorAll('polygon')
    // 8 cols × 5 rows × 2 triangles = 80 polygons
    expect(polygons.length).to.equal(80)
  })

  it('renders text elements (emoji items)', async () => {
    const c = await renderRoom('library')
    const texts = c.querySelectorAll('text')
    expect(texts.length).to.be.at.least(3)
  })

  it('polygons have valid points attributes', async () => {
    const c = await renderRoom('engine')
    const polygons = c.querySelectorAll('polygon')
    polygons.forEach(poly => {
      const pts = poly.getAttribute('points')
      expect(pts).to.be.a('string').with.length.greaterThan(0)
      // Should be pairs of numbers separated by spaces/commas
      expect(pts).to.match(/[\d.]+,[\d.]+/)
    })
  })

  it('polygons have fill colours', async () => {
    const c = await renderRoom('library')
    const polygons = c.querySelectorAll('polygon')
    polygons.forEach(poly => {
      const fill = poly.getAttribute('fill')
      expect(fill).to.be.a('string').with.length.greaterThan(0)
    })
  })

  it('SVG contains a defs element (for glow filter)', async () => {
    const c = await renderRoom('library')
    const defs = c.querySelector('defs')
    expect(defs).to.not.be.null
  })
})

// ── Room-specific emoji items ─────────────────────────────

describe('RoomSVG — library items', () => {
  let libContainer

  beforeEach(async () => {
    libContainer = await renderRoom('library')
  })

  it('contains 📚 books', async () => {
    const texts = libContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('📚')
  })

  it('contains 🕯️ candle', async () => {
    const texts = libContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('🕯️')
  })

  it('contains 📜 scroll', async () => {
    const texts = libContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('📜')
  })
})

describe('RoomSVG — engine items', () => {
  let engContainer

  beforeEach(async () => {
    engContainer = await renderRoom('engine')
  })

  it('contains ⚙️ gear', async () => {
    const texts = engContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('⚙️')
  })

  it('contains 🔧 wrench', async () => {
    const texts = engContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('🔧')
  })
})

describe('RoomSVG — specimens items', () => {
  let specContainer

  beforeEach(async () => {
    specContainer = await renderRoom('specimens')
  })

  it('contains 🔬 microscope', async () => {
    const texts = specContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('🔬')
  })

  it('contains 🧪 flask', async () => {
    const texts = specContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('🧪')
  })

  it('contains 🫙 jar', async () => {
    const texts = specContainer.querySelectorAll('text')
    const content = Array.from(texts).map(t => t.textContent)
    expect(content).to.include('🫙')
  })
})

// ── Determinism ───────────────────────────────────────────

describe('RoomSVG — determinism', () => {
  it('same room always renders same polygon count', async () => {
    const c1 = await renderRoom('library')
    const count1 = c1.querySelectorAll('polygon').length

    await act(async () => { root.unmount() })
    root = createRoot(container)

    const c2 = await renderRoom('library')
    const count2 = c2.querySelectorAll('polygon').length

    expect(count1).to.equal(count2)
  })

  it('different rooms have different first polygon fills', async () => {
    const libC = await renderRoom('library')
    const libFirstFill = libC.querySelector('polygon').getAttribute('fill')

    await act(async () => { root.unmount() })
    root = createRoot(container)

    const engC = await renderRoom('engine')
    const engFirstFill = engC.querySelector('polygon').getAttribute('fill')

    expect(libFirstFill).to.not.equal(engFirstFill)
  })
})

// ── Edge cases ────────────────────────────────────────────

describe('RoomSVG — edge cases', () => {
  it('unknown roomId renders nothing (null)', async () => {
    await act(async () => {
      root.render(createElement(RoomSVG, { roomId: 'unknown' }))
    })
    const svg = container.querySelector('svg')
    expect(svg).to.be.null
  })

  it('missing roomId (undefined) renders nothing', async () => {
    await act(async () => {
      root.render(createElement(RoomSVG, {}))
    })
    const svg = container.querySelector('svg')
    expect(svg).to.be.null
  })
})
