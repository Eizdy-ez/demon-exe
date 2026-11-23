// DEMON.EXE — deterministic screenshot scenes (?shot=...).
// Each scene builds a fixed state by hand (no RNG, no timers) so the
// dossier renders byte-identical across runs. These are real game states,
// rendered by the real renderer — not mock-ups.
import { CARD_DEFS } from './cards.js';

function card(id) {
  const def = CARD_DEFS.find((c) => c.id === id);
  return { ...def, uid: `shot-${id}` };
}

function setHand(side, ids) {
  side.hand = ids.map(card);
}

export function applyShot(g, shot) {
  if (shot === 'title' || shot === 'cover') {
    g.screen = 'title';
    return;
  }
  if (shot === 'duel') {
    g.screen = 'duel'; g.phase = 'player'; g.turn = 6; g.score = 42; g.echoes = 3; g.echoChain = 1;
    g.core = 2; g.surges = 1;
    g.player.hp = 22; g.player.ward = 4; g.player.energy = 5; g.player.maxEnergy = 5;
    g.player.deck = new Array(18).fill(null).map((_, i) => card('volt-spark'));
    g.player.discard = [card('venom-spit'), card('inferno-stomp')];
    setHand(g.player, ['volt-surge', 'venom-ward', 'hellstrike', 'surge-cell', 'void-bolt']);
    g.ai.hp = 17; g.ai.ward = 0; g.ai.energy = 4; g.ai.maxEnergy = 5;
    g.ai.deck = new Array(16).fill(null).map((_, i) => card('venom-spit'));
    setHand(g.ai, ['venom-spit', 'inferno-stomp', 'volt-spark', 'void-veil', 'soul-draw']);
    g.lastElement = 'Volt';
    g.lastPlayed = [card('plague-rebuke'), card('volt-spark'), { ...card('volt-surge'), echo: true }];
    g.damageDealt = 28;
    g.banner = { text: 'ECHO!', sub: 'The core answers Volt — effect doubled x2', until: Infinity };
    g.log = [
      'Vex plays Volt Surge — 10 damage (ECHO x2).',
      'Voidreaper plays Volt Spark — 3 damage.',
      'Turn 6 — your move. Energy refilled to 5.',
    ];
    return;
  }
  if (shot === 'win') {
    g.screen = 'win'; g.phase = 'over'; g.turn = 9; g.score = 127; g.echoes = 5; g.echoChain = 2;
    g.core = 1; g.surges = 2;
    g.damageDealt = 41;
    g.player.hp = 14; g.player.ward = 3; g.player.energy = 2; g.player.maxEnergy = 8;
    g.player.deck = new Array(9).fill(null).map((_, i) => card('volt-spark'));
    setHand(g.player, ['storm-lance', 'venom-ward', 'soul-draw']);
    g.ai.hp = 0; g.ai.ward = 0;
    g.ai.deck = new Array(11).fill(null).map((_, i) => card('venom-spit'));
    setHand(g.ai, ['venom-spit', 'inferno-stomp']);
    g.lastElement = 'Volt';
    g.lastPlayed = [card('hellstrike'), card('volt-spark'), { ...card('storm-lance'), echo: true }];
    g.playedCards = [card('volt-spark'), card('venom-spit'), { ...card('volt-surge'), echo: true }, card('surge-cell'), card('inferno-stomp'), { ...card('venom-ward'), echo: true }, card('void-bolt'), card('soul-draw'), card('hellstrike'), { ...card('storm-lance'), echo: true }];
    g.log = ['Vex plays Storm Lance — 14 damage (ECHO x2).', 'VOIDREAPER FALLS. The grid is yours.'];
    return;
  }
  if (shot === 'lose') {
    g.screen = 'lose'; g.phase = 'over'; g.turn = 8; g.score = 61; g.echoes = 2; g.echoChain = 0;
    g.core = 0; g.surges = 0;
    g.damageDealt = 19;
    g.player.hp = 0; g.player.ward = 0; g.player.energy = 1; g.player.maxEnergy = 7;
    g.player.deck = new Array(12).fill(null).map((_, i) => card('volt-spark'));
    setHand(g.player, ['surge-cell', 'void-veil', 'venom-spit']);
    g.ai.hp = 9; g.ai.ward = 5;
    g.ai.deck = new Array(10).fill(null).map((_, i) => card('venom-spit'));
    setHand(g.ai, ['volt-judgment', 'hellstrike']);
    g.lastElement = 'Volt';
    g.lastPlayed = [card('venom-ward'), card('volt-surge'), { ...card('volt-judgment'), echo: true }];
    g.playedCards = [card('surge-cell'), card('void-veil'), { ...card('volt-spark'), echo: true }, card('venom-spit'), card('inferno-stomp'), card('volt-surge'), { ...card('venom-ward'), echo: true }, card('void-bolt'), card('soul-draw'), { ...card('volt-judgment'), echo: true }];
    g.log = ['Voidreaper plays Volt Judgment — 18 damage (ECHO x2).', 'Your core burns out. Voidreaper claims the grid.'];
    return;
  }
  g.screen = 'title';
}
