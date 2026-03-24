# 🦕 There Be Dragons

> *"The plane went down in the jungle. In the distance, through the trees — rooftops."*

A turn-based roguelike educational game for kids aged 8–13. A family survives a plane crash in the Amazon and discovers a research station sealed since 1912. Three kids, three rooms, one shared torch pool — and permadeath.

Loosely inspired by Sir Arthur Conan Doyle's *The Lost World*.

---

## Story

You are three siblings on a research flight over the Amazon with your Dad. The plane goes down. Through the jungle, you spot buildings — **Challenger Station**, a lab established in 1912 and sealed ever since. The equipment is still running. The journals stop mid-sentence. Something is moving in the trees outside.


| Character | Age |
|-----|-----|
| Oldest | 13 |
| Middle | 10 |
| Youngest | 8 |
| Dad | 41 |

---

## Game Flows

### Game generation
```
Someone (usually parent) enters flashcards: front, back and red-herrings(optional). Number of times the card should appear.
  ↓
  Seed is picked based on hash of flashcard content
  ↓
One room is created per 2 to 3 flashcards with one flashcard reserved for hub room
  ↓
order is decided based on seed
```

### Gameplay
```
Name your three kids/Dad
  ↓
  Player
Entrance to Challenger Station - 6 x 6 green tiles with entrance
  ↓
Hub Room - 12 X 12 tiles sepia/grey colorscheme - contains box with mechanical lock and 3 doors. Lock requires paper with correct answer in order to open box. Player must find correct answer scattered around hub if red herrings added or type answer.
Box contains key to one of the doors.
  ↓
Rooms 3 connected to hub then others in addition to that based on cards entered. Each contains box like in hub that can only be opened with correct answer to get key to available room.
  ↓
Once all rooms cleared player wins
```

**Pure roguelike.** Nothing carries between runs except character names. Room order is seeded-random each run. Puzzle order within rooms is seeded-random.

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
Old. Needs to be completely revised.
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

Needs revision

---

## Roadmap

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