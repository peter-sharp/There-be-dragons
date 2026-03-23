# 🦕 There Be Dragons

> *"The plane went down in the jungle. In the distance, through the trees — rooftops."*

A turn-based roguelike educational game for kids aged 8–13. A family survives a plane crash in the Amazon and discovers a research station sealed since 1912. Three kids, three rooms, one shared torch pool — and permadeath.

Loosely inspired by Sir Arthur Conan Doyle's *The Lost World*.

---

## Story

You are three siblings on a research flight over the Amazon with your Dad. The plane goes down. Through the jungle, you spot buildings — **Challenger Station**, a lab established in 1912 and sealed ever since. The equipment is still running. The journals stop mid-sentence. Something is moving in the trees outside.

Each kid specialises in one room:

| Kid | Age | Room | Subject |
|-----|-----|------|---------|
| Oldest | 13 | The Library | Literacy |
| Middle | 10 | The Engine Room | Maths |
| Youngest | 8 | The Specimen Hall | Science |

Dad keeps watch. The family moves together.

---

## Game Loop

```
Name your three kids
  ↓
Challenger Station hub — choose which room to enter
  ↓
Room — 3 chained puzzles (escape-room style)
  Wrong answer = −1 torch from the shared pool
  Clear the room = +1 torch + possible ability card
  ↓
Boss — The Central Hall (unlocks after all 3 rooms)
  Uses clues found across all rooms
  ↓
Win — the mystery of July 14, 1912 is solved
  OR
Dead — torches hit 0, lights out, start again
```

**Pure roguelike.** Nothing carries between runs except kid names. Room order is player-chosen each run. Puzzle order within rooms is seeded-random.

---

## Stack

- **React 19** via ESM importmap — no build step, no bundler
- **Zustand 5** via esm.sh — slices pattern, persist middleware, devtools
- **Vanilla CSS** — aged parchment / candlelight lab theme, mobile-first
- **PWA** — service worker, installable, offline-capable
- **JSDoc** types for VS Code intellisense without TypeScript

---

## Run locally

```bash
# Any static file server — must be HTTP not file://
npx serve .
# or
python3 -m http.server 3000
```

Open `http://localhost:3000`

> ⚠️ Import maps don't work from `file://` — always use a local server

---

## Project structure

```
/
├── index.html                  # PWA shell + ESM importmap
├── manifest.json               # PWA manifest
├── sw.js                       # Service worker (offline cache)
└── src/
    ├── app.jsx                 # Screen router (reads store.screen)
    ├── store.js                # Zustand store — 3 slices + seeded RNG
    ├── data/
    │   └── puzzles.js          # Puzzle pools, ability cards, boss puzzle
    ├── screens/
    │   ├── NameScreen.jsx      # Name entry for all 3 kids
    │   ├── HubScreen.jsx       # Station map, torch bar, room selection
    │   ├── RoomScreen.jsx      # Puzzle chain runner
    │   └── GameScreens.jsx     # Dead, Win, AbilityCard, Boss screens
    ├── components/
    │   ├── HUD.jsx             # Torch pips + back button
    │   ├── WordOrderPuzzle.jsx # Drag words into order (literacy)
    │   ├── NumberFillPuzzle.jsx# Fill the missing number (maths)
    │   └── MatchPuzzle.jsx     # Match items to descriptions (science)
    └── styles/
        └── main.css            # Full theme — lab interior + jungle
```

---

## Store architecture

Three Zustand slices:

| Slice | Persists | Owns |
|-------|----------|------|
| `metaSlice` | ✅ localStorage | Kid names, total runs |
| `runSlice` | ❌ resets each run | Torches, rooms cleared, clues, ability cards, seed |
| `uiSlice` | ❌ resets each run | Current screen, active room |

`partialize` in the persist config ensures only `metaSlice` data is saved — run state always starts fresh.

---

## Adding content

**New puzzle to a room:**
1. Add an entry to the relevant pool in `src/data/puzzles.js`
   (`LIBRARY_POOL`, `ENGINE_POOL`, or `SPECIMEN_POOL`)
2. The room draws 3 puzzles per run automatically via seeded shuffle

**New puzzle type:**
1. Create `src/components/YourPuzzle.jsx`
   — props: `{ puzzle, onSolved(answer), onWrong() }`
2. Add a case to the `renderPuzzle` switch in `RoomScreen.jsx`
3. Add puzzle data with `type: 'your-type'` to the relevant pool

**New ability card:**
1. Add to `ABILITY_CARDS` in `src/data/puzzles.js`
2. Map it to a room in `ABILITY_CARD_ROOMS` in `RoomScreen.jsx`
3. Handle the `effect` string in your UI

**New screen:**
1. Create `src/screens/YourScreen.jsx`
2. Add a case to the switch in `src/app.jsx`
3. Navigate to it via `useStore(s => s.goTo)('your-screen')`

---

## Roadmap

- [ ] Flesh out maths puzzles (NumberFillPuzzle)
- [ ] Flesh out science puzzles (MatchPuzzle)
- [ ] Ability card UI — show hand, allow use during puzzles
- [ ] Illustrated character portraits for each kid + Dad
- [ ] Dinosaur silhouette animations outside windows
- [ ] Sound effects (jungle ambience, torch flicker)
- [ ] Migrate to Vite + vite-plugin-pwa for production build
- [ ] Additional puzzle types (cipher, diagram labelling)
- [ ] Second run of rooms with harder puzzle variants

---

## Migrating to Vite

When ready to ship:
```bash
npm create vite@latest . -- --template react
npm install vite-plugin-pwa
```
All components are identical — Vite handles the importmap automatically.

---

*"They chose to stay." — Dr. E. Morrow, July 14, 1912*