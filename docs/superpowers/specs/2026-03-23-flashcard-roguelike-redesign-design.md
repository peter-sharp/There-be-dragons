# There Be Dragons — Flashcard Roguelike Redesign

## Overview

Rebuild the game from scratch as a flashcard-driven roguelike. Anyone (parent, teacher, or child) enters term/definition flashcards, and the game generates a seeded set of rooms to explore. Players navigate tile grids, collect scattered papers, and match correct answers to locked boxes to progress through a branching room tree.

The story (Challenger Station, Amazon plane crash, 1912 mystery) is preserved as a narrative wrapper. The parchment/lab and low-poly SVG aesthetic directions are preserved for future polish — initial build uses simple flat tiles.

## Screen Flow

```
Title Screen (story intro + "Start")
  ↓
Flashcard Entry (form + CSV import)
  ↓
Entrance (6×6 green grid, brief story text)
  ↓
Hub Room (12×12 sepia/grey grid, 1 box, 3 locked doors)
  ↓
Room branches (2-3 cards per room, sub-rooms branch deeper)
  ↓
Win Screen (story outro + "Play Again")
```

### Title Screen
Brief narrative intro: the plane crash, the jungle, Challenger Station. A "Start" button.

### Flashcard Entry
- Form-based: text fields for front (term), back (definition), up to 4 optional red herring fields, repeat count
- CSV import button (columns: `front, back, redHerring1, redHerring2, redHerring3, redHerring4, repeats` — empty herring columns are ignored)
- Card list showing entered cards with edit/delete
- "Generate Game" button — hashes card content to produce seed, transitions to Entrance
- Minimum 4 cards required to generate a game (1 hub + 3 rooms with 1 card each)

### Entrance
- 6×6 green tile grid
- Narrative text overlay: "You push open the door..."
- Player walks to the exit to enter the Hub

### Hub Room
- 12×12 sepia/grey tile grid
- 1 locked box (uses the hub's reserved flashcard)
- Papers scattered: correct answer + red herrings for the hub card
- 3 locked doors (one per branch)
- Solving the hub box yields 1 key — unlocks the first door (seeded order)

### Rooms
- Each room has 1-3 locked boxes (one per flashcard assigned to it)
- All papers for all cards in that room are scattered simultaneously
- Per card: 1 correct paper + all red herrings from that card. Cards with 0 red herrings get only the correct paper (player must still bring it to the box)
- Player must match correct papers to correct boxes
- Rooms may contain a door to a sub-room (key found in one of the boxes)
- The hub-door key (to unlock the next branch) is always in the deepest room of the branch

### Win Screen
- Story outro text
- "Play Again" button — same cards produce the same seed/layout

## Room Tree Structure

### Generation Algorithm
1. Hash all card content → deterministic `seed`
2. Reserve 1 card for the hub room
3. Shuffle remaining cards using seeded RNG
4. Split into groups of 2-3 cards each
5. First 3 groups → hub rooms (branches A, B, C)
6. Remaining groups → sub-rooms, distributed round-robin across the 3 branches (seeded order)
7. Hub-door key placement: always in the deepest room of each branch
8. Room order (which hub door opens first) determined by seed

### Example (10 cards)
```
HUB (1 card) → solve box → key to Door A
  ├── Room A (2 cards)
  │     └── Room A-1 (2 cards) ← hub-door key to Door B is HERE
  ├── Room B (3 cards) ← hub-door key to Door C is HERE
  └── Room C (2 cards) ← last branch, solve all to win
```

### Edge Cases
- **4 cards (minimum)**: 1 hub + 3 rooms with 1 card each, no sub-rooms
- **5-6 cards**: 1 hub + some rooms get 2 cards, others get 1
- **7-10 cards**: 1 hub + 3 rooms with 2 cards each + possible sub-rooms for overflow
- **Many cards (20+)**: deeper sub-room chains in each branch
- **Repeat count > 1**: card appears in multiple rooms (same term/definition, different paper positions)
- **0 red herrings on a card**: only the correct paper appears. Player still must pick it up and bring it to the box.

## Room Grid Design

### Layout
- Room grid size based on card count: 1 card → 10×10, 2 cards → 12×12, 3 cards → 14×14
- Hub room is always 12×12
- Entrance room is always 6×6
- Rendered as SVG `<rect>` elements
- Wall tiles form the border
- Entrance at bottom center (gap in wall)
- Door to sub-room (if any) at top center (locked)

### Entities (React components positioned on grid)
- **Player** 🧑 — spawns at entrance, moves with arrow keys or tap-near-character
- **Paper** 📄 — scattered on random walkable tiles, walk over to collect
- **Box** 📦 — positioned against walls, walk adjacent to interact
- **Door** 🔒 — in wall, unlocked by a key from a box

### Entity Placement
- Boxes placed along inner walls (1 tile from wall, not blocking entrance/door)
- Papers placed on random walkable interior tiles (seeded), minimum 2 tiles apart. If spacing can't be satisfied (many papers), reduce to minimum 1 tile apart. Papers use SVG filter color variants (hue-rotate) to visually distinguish them from each other
- Path guaranteed from entrance to all entities (flood-fill validation during generation; if placement fails after 10 retries, regenerate the room layout with a different sub-seed)

## Interaction Model

### Movement
- **Arrow keys**: move 1 tile per keypress, 4-directional (up/down/left/right, no diagonals)
- **Click/tap**: click an adjacent tile (4-directional) to move the player one step in that direction
- Player cannot walk through walls, boxes, or locked doors

### Paper Collection
- Walk onto a paper tile → paper auto-collected into inventory
- Paper removed from grid, appears in HUD inventory bar
- Inventory shows paper text (the definition or red herring text)

### Box Interaction
- Walk adjacent to a box → box panel appears inline below the SVG grid (player remains visible on grid)
- Shows the **term** (front of card)
- Player selects a paper from inventory to try
- **Correct**: box opens with animation, may reveal a key. Paper consumed.
- **Wrong**: box stays locked, paper returns to inventory. No penalty.

### Key & Door
- Key auto-collected when box opens (if box contains one)
- Keys colored using SVG filters to match their corresponding door
- Keys shown in HUD
- Walking to a locked door with matching key → door unlocks and opens
- Player walks through to enter sub-room or return to hub

## State Architecture (Zustand)

### deckSlice (persisted to localStorage)
```
cards: Array<{
  id: string,
  front: string,        // term
  back: string,         // definition (correct answer)
  redHerrings: string[], // wrong answers (optional)
  repeats: number       // how many times card appears (default 1)
}>
```
Actions: `addCard`, `updateCard`, `removeCard`, `importCSV`, `clearDeck`

### runSlice (reset each game)
```
seed: number,                    // hash of card content
roomTree: {
  hub: Room,
  branches: Array<{
    rooms: Room[]                // [topRoom, ...subRooms] deepest last
  }>
},
currentRoomId: string,
playerPos: { x: number, y: number },
inventory: Array<{
  id: string,
  text: string,                  // paper content
  cardId: string,                // which card this is the answer/herring for
  isCorrect: boolean             // (internal, not shown to player)
}>,
unlockedDoors: string[],
openedBoxes: string[],
collectedPapers: string[],       // paper IDs already picked up
keysHeld: string[]               // key IDs in player's possession
```
Actions: `generateGame`, `movePlayer`, `collectPaper`, `tryPaperOnBox`, `useKey`

### Room type
```
Room {
  id: string,
  gridWidth: number,
  gridHeight: number,
  cards: Card[],                  // 1-3 flashcards for this room
  boxes: Array<{ id, pos, cardId, containsKey?: string }>,
  papers: Array<{ id, pos, text, cardId, isCorrect }>,
  doors: Array<{ id, pos, targetRoomId, requiredKeyId }>,
  entrance: { pos, fromRoomId },
  walls: Set<string>              // "x,y" coords of wall tiles
}
```

### uiSlice (transient)
```
screen: 'title' | 'cards' | 'game' | 'win',
activeBox: string | null,        // box ID being interacted with
narrativeText: string | null     // story text overlay
```

## Seeded RNG

Reuse the existing Mulberry32 PRNG from the current codebase (`makeRng`, `seededShuffle` in `store.js`). Seed derived from hashing all card content ensures:
- Same cards → same room layout → same paper positions
- Different cards → different game
- Future "share your game" via exporting the card deck

## Tech Stack (unchanged)

- React 19 via ESM importmap (no build step)
- Zustand 5 via esm.sh (slices pattern, persist middleware)
- htm for JSX-free templates
- Vanilla CSS (simple flat tiles for now)
- SVG rendering for tile grids
- PWA (service worker, offline-capable)

## Project Structure

```
/
├── index.html                    # PWA shell + ESM importmap
├── manifest.json                 # PWA manifest
├── sw.js                         # Service worker
└── src/
    ├── app.js                    # Screen router
    ├── store.js                  # Zustand: deckSlice + runSlice + uiSlice
    ├── rng.js                    # makeRng, seededShuffle, hashCards
    ├── generate.js               # Room tree generation from cards
    ├── screens/
    │   ├── TitleScreen.js        # Story intro + start
    │   ├── CardEntryScreen.js    # Flashcard form + CSV import
    │   ├── GameScreen.js         # Main game view (delegates to Room)
    │   └── WinScreen.js          # Victory + play again
    ├── components/
    │   ├── Room.js               # SVG grid renderer + movement handler
    │   ├── Player.js             # Player entity (SVG)
    │   ├── Paper.js              # Paper entity (SVG)
    │   ├── Box.js                # Box entity (SVG) + interaction UI
    │   ├── Door.js               # Door entity (SVG)
    │   ├── HUD.js                # Inventory bar, keys, narrative text
    │   └── CardForm.js           # Single card entry form
    └── styles/
        └── main.css              # Flat tile theme + layout
```

## What's Kept from Current Codebase
- Seeded RNG functions (Mulberry32, seededShuffle)
- PWA infrastructure (service worker, manifest)
- ESM importmap approach
- Story text and setting (Challenger Station narrative)

## What's Scrapped
- All existing screens (NameScreen, HubScreen, RoomScreen, GameScreens)
- All puzzle components (WordOrderPuzzle, NumberFillPuzzle, MatchPuzzle)
- Hardcoded puzzle pools (puzzles.js)
- Character/kid system (names, personalities, ability cards)
- Torch/permadeath mechanic
- RoomSVG low-poly backgrounds (deferred to future)

## Out of Scope (Future)
- Enemies and hearts/health system
- Character naming and personality system
- Low-poly SVG room backgrounds
- Sound effects and animations
- Dinosaur silhouettes
- Vite migration
