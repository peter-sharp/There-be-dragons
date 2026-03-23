/**
 * data/puzzles.js — Puzzle pools for each room
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PUZZLE STRUCTURE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Each room has a POOL of puzzles. At run start, 3 are drawn
 * from the pool using the run seed (seededShuffle), so the
 * order is different every run but deterministic per seed.
 *
 * The third puzzle in a room always produces a CLUE — a word,
 * number, or symbol that feeds into the boss encounter.
 *
 * PUZZLE TYPES (add more as game grows):
 *   'word-order'   — drag words into correct sentence order (literacy)
 *   'number-fill'  — fill in the missing number (maths) [stub]
 *   'match'        — match specimen to description (science) [stub]
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ESCAPE-ROOM CHAINING
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Within a room, puzzle 2 may reference the answer from puzzle 1.
 * This is done via the `usesClueFrom` field — the puzzle renderer
 * injects the previous answer into the flavour text at runtime.
 *
 * Example:
 *   puzzle 1 answer: 'MORROW'
 *   puzzle 2 flavour: 'The name on the door is {clue}. What year did they arrive?'
 *   → rendered as: 'The name on the door is MORROW. What year did they arrive?'
 */

/**
 * @typedef {{
 *   id: string,
 *   type: 'word-order' | 'number-fill' | 'match',
 *   context: string,
 *   flavour: string,
 *   usesClueFrom?: 'prev',
 *   producesClue?: boolean,
 *   dadReaction: string,
 *   kidReactions: Record<string, string>,
 * } & (
 *   { type: 'word-order', words: string[], answer: string } |
 *   { type: 'number-fill', template: string, answer: number, hint: string } |
 *   { type: 'match', pairs: Array<{item: string, match: string}> }
 * )} Puzzle
 */

// ─────────────────────────────────────────────────────────
// LIBRARY — Literacy puzzles (word-order)
// Lead kid: oldest
// ─────────────────────────────────────────────────────────

export const LIBRARY_POOL = [
  {
    id: 'lib-a',
    type: 'word-order',
    context: 'Journal of Dr. E. Morrow · July 9, 1912',
    flavour: 'The first page is warped by damp. Reconstruct the entry:',
    words: ['We', 'have', 'found', 'the', 'plateau'],
    answer: 'We have found the plateau',
    dadReaction: '"July 9th. Five days before the last entry. They were excited."',
    kidReactions: {
      middle: '"Plateau — that\'s like a flat hill, right? I already knew that."',
      youngest: '"Why would you write about a hill? Were there dinosaurs on it?"',
    },
  },
  {
    id: 'lib-b',
    type: 'word-order',
    context: 'Journal of Dr. E. Morrow · July 11, 1912',
    flavour: 'Two days later. The ink is smeared but legible:',
    words: ['The', 'creatures', 'are', 'not', 'afraid', 'of', 'us'],
    answer: 'The creatures are not afraid of us',
    dadReaction: '"Not afraid. That\'s either wonderful or very bad. Probably both."',
    kidReactions: {
      middle: '"So they just... walked up to them? Bold."',
      youngest: '"I would not be afraid either. I would say hello."',
    },
  },
  {
    id: 'lib-c',
    type: 'word-order',
    context: 'Journal of Dr. E. Morrow · July 12, 1912',
    flavour: 'A loose page, folded into the back cover:',
    words: ['Do', 'not', 'feed', 'the', 'large', 'one'],
    answer: 'Do not feed the large one',
    dadReaction: '"...There is a large one." *pause* "Good to know."',
    kidReactions: {
      middle: '"How large? Like, dog large? Or bus large?"',
      youngest: '"But what does it EAT?"',
    },
  },
  {
    id: 'lib-d',
    type: 'word-order',
    context: 'Journal of Dr. E. Morrow · July 13, 1912',
    flavour: 'Yesterday\'s entry. Someone underlined this sentence:',
    words: ['The', 'generator', 'must', 'never', 'be', 'switched', 'off'],
    answer: 'The generator must never be switched off',
    dadReaction: '"That\'s why the lights are still on. Someone followed those instructions."',
    kidReactions: {
      middle: '"I could find the generator. Easy."',
      youngest: '"What happens if you switch it off? Can we try?"',
    },
  },
  {
    id: 'lib-e',
    type: 'word-order',
    context: 'Journal of Dr. E. Morrow · July 14, 1912',
    flavour: 'The last entry. The handwriting is rushed — it stops mid-sentence:',
    words: ['Lock', 'the', 'doors', 'and', 'do', 'not'],
    answer: 'Lock the doors and do not',
    producesClue: true,
    dadReaction: '"Do not what? That\'s where it ends." *long silence* "Lock the doors."',
    kidReactions: {
      middle: '"Do not... open them? Run? Panic? All three?"',
      youngest: '"Do not... feed the large one again?"',
    },
  },
]

// ─────────────────────────────────────────────────────────
// ENGINE ROOM — Maths puzzles (number-fill) [STUB]
// Lead kid: middle
// ─────────────────────────────────────────────────────────

export const ENGINE_POOL = [
  {
    id: 'eng-a',
    type: 'number-fill',
    context: 'Pressure gauge · Boiler A',
    flavour: 'The gauge reads {clue} on the left dial. The right dial must match. What number?',
    template: 'The left dial reads ___. The right must equal it.',
    answer: 7,
    hint: 'Both dials must show the same value to stabilise the boiler.',
    dadReaction: '"Good. Equal pressure. Don\'t touch anything else."',
    kidReactions: {
      oldest: '"I would have read the manual first."',
      youngest: '"What if we turned it up to eleven?"',
    },
  },
  {
    id: 'eng-b',
    type: 'number-fill',
    context: 'Fuel consumption log · Week 3',
    flavour: 'The log shows 3 units burned per day. How many units burned in 4 days?',
    template: '3 × 4 = ___',
    answer: 12,
    hint: 'Multiply the daily rate by the number of days.',
    dadReaction: '"12 units. And it\'s been running 100 years. Whatever this fuel is — it\'s not coal."',
    kidReactions: {
      oldest: '"I\'ve already worked it out." — wait, that\'s your line.',
      youngest: '"Is the fuel dinosaurs?"',
    },
  },
  {
    id: 'eng-c',
    type: 'number-fill',
    context: 'Access code panel · Storage Room B',
    flavour: 'The panel shows: 8, 16, 32, ___. What comes next?',
    template: '8, 16, 32, ___',
    answer: 64,
    producesClue: true,
    hint: 'Each number doubles.',
    dadReaction: '"64. Doubling sequence. Someone liked their powers of two."',
    kidReactions: {
      oldest: '"I would have got there eventually."',
      youngest: '"Sixty-four what though?"',
    },
  },
]

// ─────────────────────────────────────────────────────────
// SPECIMEN HALL — Science puzzles (match) [STUB]
// Lead kid: youngest
// ─────────────────────────────────────────────────────────

export const SPECIMEN_POOL = [
  {
    id: 'spec-a',
    type: 'match',
    context: 'Specimen jar · Shelf C',
    flavour: 'Match each sketch to the correct description on the label:',
    pairs: [
      { item: '🦕', match: 'Long neck, plant eater' },
      { item: '🦖', match: 'Short arms, large jaw' },
      { item: '🦅', match: 'Leathery wings, no feathers' },
    ],
    dadReaction: '"These aren\'t sketches. These are... field observations. They SAW these."',
    kidReactions: {
      oldest: '"The taxonomy is all wrong. They didn\'t have the vocabulary yet."',
      middle: '"The one with short arms looks annoyed."',
    },
  },
  {
    id: 'spec-b',
    type: 'match',
    context: 'Growth chart · Specimen 7',
    flavour: 'The chart tracks Specimen 7 over three years. Match year to size:',
    pairs: [
      { item: 'Year 1', match: 'Fits in a crate' },
      { item: 'Year 2', match: 'Size of a horse' },
      { item: 'Year 3', match: 'Larger than the lab' },
    ],
    dadReaction: '"Year three... larger than the lab." *looks at the window* "When was year three?"',
    kidReactions: {
      oldest: '"The specimen is still alive, isn\'t it."',
      middle: '"That\'s just a growth rate problem. We can calculate where it is now."',
    },
  },
  {
    id: 'spec-c',
    type: 'match',
    context: 'Diet analysis · All specimens',
    flavour: 'Match each specimen to what the researchers fed it:',
    pairs: [
      { item: '🌿 Plant eater', match: 'Ferns from the east ridge' },
      { item: '🥩 Meat eater', match: 'Whatever it caught' },
      { item: '🐟 Both', match: 'Fish from the plateau lake' },
    ],
    producesClue: true,
    dadReaction: '"Whatever it caught." *closes notebook* "Right."',
    kidReactions: {
      oldest: '"This is actually very thorough science for 1912."',
      middle: '"\'Whatever it caught\' is not a scientific diet plan."',
    },
  },
]

// ─────────────────────────────────────────────────────────
// ABILITY CARDS
// Earned at special moments — not guaranteed every room.
// ─────────────────────────────────────────────────────────

export const ABILITY_CARDS = [
  {
    id: 'dads-compass',
    name: "Dad's Compass",
    description: 'Skip the current puzzle entirely.',
    effect: 'skip-puzzle',
    emoji: '🧭',
    kidId: null, // any kid can use it
  },
  {
    id: 'field-journal',
    name: 'Field Journal',
    description: 'Reveal the correct word order as a hint.',
    effect: 'reveal-hint',
    emoji: '📓',
    kidId: 'oldest',
  },
  {
    id: 'pocket-calculator',
    name: 'Pocket Calculator',
    description: 'Auto-solve one number puzzle.',
    effect: 'auto-solve',
    emoji: '🔢',
    kidId: 'middle',
  },
  {
    id: 'specimen-jar',
    name: 'Specimen Jar',
    description: 'The family finds a torch inside. +1 torch.',
    effect: 'gain-torch',
    emoji: '🏺',
    kidId: 'youngest',
  },
]

// ─────────────────────────────────────────────────────────
// BOSS PUZZLE [STUB]
// Uses clues from all 3 rooms.
// ─────────────────────────────────────────────────────────

export const BOSS_PUZZLE = {
  id: 'boss',
  context: 'Challenger Station · Central Hall · July 14, 1912',
  flavour: 'Three clues. Three rooms. One question: what did the 1912 team find — and why did they seal the doors from the inside?',
  // clues injected at runtime from run.cluesFound
  type: 'word-order', // placeholder — will become a multi-step puzzle
  words: ['They', 'chose', 'to', 'stay'],
  answer: 'They chose to stay',
  dadReaction: '"They chose to stay. They weren\'t trapped. They... stayed." *sits down slowly* "They found something worth staying for."',
}
