// DEMON.EXE — the card catalogue.
// A neon demon duel on the grid. Two summoners, one burning core:
// Vex, the Neon Summoner, against Voidreaper, the Demon Core.
// Four demon strains take the place of suits — Inferno, Volt, Venom, Void —
// each with its own colour and its own demon glyph, drawn in canvas.
// Every card is an original design for this bounty — no borrowed game.
//
// THE ECHO RULE: play a card whose strain matches the last card played
// by either duellist and the core answers — its effect happens TWICE.
// THE CORE: every third echo overloads the Demon Core. The duellist
// who woke it gains +4 life and draws 2 cards.

export const ELEMENTS = {
  Inferno: { color: '#e04a3a', dark: '#571509', light: '#ffc4bc', glyph: 'I', bg0: '#4a140d', bg1: '#200604' },
  Volt: { color: '#d4a017', dark: '#5c4306', light: '#ffe9a8', glyph: 'V', bg0: '#4a3608', bg1: '#1e1202' },
  Venom: { color: '#4caf7d', dark: '#123f2a', light: '#bdeeda', glyph: 'V', bg0: '#0e3320', bg1: '#04160c' },
  Void: { color: '#9a7bd0', dark: '#3a2560', light: '#e2d4ff', glyph: 'V', bg0: '#2c1a4a', bg1: '#120826' },
};

export const ELEMENT_GLOSS = {
  Inferno: 'HELLFIRE', Volt: 'STORM', Venom: 'PLAGUE', Void: 'SHADOW',
};

// kind: damage | shield | heal | draw. power is the base amount; Echo doubles it.
export const CARD_DEFS = [
  { id: 'volt-spark', name: 'Volt Spark', element: 'Volt', cost: 1, power: 3, kind: 'damage', text: 'Deal 3 damage.' },
  { id: 'volt-surge', name: 'Volt Surge', element: 'Volt', cost: 2, power: 5, kind: 'damage', text: 'Deal 5 damage.' },
  { id: 'storm-lance', name: 'Storm Lance', element: 'Volt', cost: 3, power: 7, kind: 'damage', text: 'Deal 7 damage.' },
  { id: 'volt-judgment', name: 'Volt Judgment', element: 'Volt', cost: 4, power: 9, kind: 'damage', text: 'Deal 9 damage.' },
  { id: 'surge-cell', name: 'Surge Cell', element: 'Volt', cost: 2, power: 6, kind: 'heal', text: 'Restore 6 life.' },
  { id: 'venom-spit', name: 'Venom Spit', element: 'Venom', cost: 1, power: 3, kind: 'damage', text: 'Deal 3 damage.' },
  { id: 'venom-ward', name: 'Venom Ward', element: 'Venom', cost: 2, power: 7, kind: 'shield', text: 'Gain 7 ward.' },
  { id: 'plague-rebuke', name: 'Plague Rebuke', element: 'Venom', cost: 3, power: 5, kind: 'damage', text: 'Deal 5 damage.' },
  { id: 'venom-pact', name: 'Venom Pact', element: 'Venom', cost: 4, power: 8, kind: 'damage', text: 'Deal 8 damage.' },
  { id: 'blood-tithe', name: 'Blood Tithe', element: 'Venom', cost: 2, power: 6, kind: 'heal', text: 'Restore 6 life.' },
  { id: 'inferno-stomp', name: 'Inferno Stomp', element: 'Inferno', cost: 1, power: 3, kind: 'damage', text: 'Deal 3 damage.' },
  { id: 'hellstrike', name: 'Hellstrike', element: 'Inferno', cost: 2, power: 5, kind: 'damage', text: 'Deal 5 damage.' },
  { id: 'soul-draw', name: 'Soul Draw', element: 'Inferno', cost: 2, power: 2, kind: 'draw', text: 'Draw 2 cards.' },
  { id: 'hell-roar', name: 'Hell Roar', element: 'Inferno', cost: 3, power: 7, kind: 'damage', text: 'Deal 7 damage.' },
  { id: 'inferno-pact', name: 'Inferno Pact', element: 'Inferno', cost: 4, power: 9, kind: 'damage', text: 'Deal 9 damage.' },
  { id: 'void-veil', name: 'Void Veil', element: 'Void', cost: 1, power: 4, kind: 'shield', text: 'Gain 4 ward.' },
  { id: 'void-aegis', name: 'Void Aegis', element: 'Void', cost: 2, power: 7, kind: 'shield', text: 'Gain 7 ward.' },
  { id: 'void-bolt', name: 'Void Bolt', element: 'Void', cost: 2, power: 5, kind: 'damage', text: 'Deal 5 damage.' },
  { id: 'void-pact', name: 'Void Pact', element: 'Void', cost: 4, power: 12, kind: 'shield', text: 'Gain 12 ward.' },
  { id: 'void-mend', name: 'Void Mend', element: 'Void', cost: 2, power: 6, kind: 'heal', text: 'Restore 6 life.' },
];

export const KIND_LABEL = { damage: 'STRIKE', shield: 'WARD', heal: 'MEND', draw: 'DRAW' };
export const KIND_VERB = { damage: 'damage', shield: 'ward', heal: 'life', draw: 'cards' };

// A 30-card deck: every design once, then extra copies of the cheap
// workhorse cards so early turns always have a play.
const DECK_COUNTS = {
  'volt-spark': 2, 'volt-surge': 2, 'storm-lance': 1, 'volt-judgment': 1, 'surge-cell': 2,
  'venom-spit': 2, 'venom-ward': 2, 'plague-rebuke': 1, 'venom-pact': 1, 'blood-tithe': 1,
  'inferno-stomp': 2, 'hellstrike': 2, 'soul-draw': 2, 'hell-roar': 1, 'inferno-pact': 1,
  'void-veil': 2, 'void-aegis': 1, 'void-bolt': 2, 'void-pact': 1, 'void-mend': 1,
};

export function buildDeck() {
  const deck = [];
  for (const def of CARD_DEFS) {
    const n = DECK_COUNTS[def.id] ?? 1;
    for (let i = 0; i < n; i++) deck.push({ ...def, uid: `${def.id}#${i}` });
  }
  return deck; // 30 cards
}

// Deterministic shuffle (mulberry32). Same seed -> same deck, every run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, seed) {
  const rnd = mulberry32(seed);
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// Small deterministic hash for decorative details (ember motes, circuit dots).
export function hash2(x, y, salt = 0) {
  let h = (x * 374761393 + y * 668265263 + salt * 974634211) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
