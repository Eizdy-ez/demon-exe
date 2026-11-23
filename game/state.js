// DEMON.EXE — game state and rules. No rendering here, no DOM here:
// pure turn logic, so the autoplay tester and the UI share one truth.
import { buildDeck, shuffle } from './cards.js';

export const MAX_HP = 30;
export const MAX_ENERGY = 10;
export const MAX_HAND = 7;

export function makeSide(name, short, deck, seed) {
  return {
    name, short, hp: MAX_HP, maxHp: MAX_HP, ward: 0,
    deck: shuffle(buildDeck(), seed),
    hand: [], discard: [],
    energy: 1, maxEnergy: 1,
  };
}

export function createGame(seed = 20261123) {
  const g = {
    seed,
    screen: 'title', // title | duel | win | lose
    turn: 1,
    phase: 'player', // player | ai | over
    score: 0,
    damageDealt: 0,
    echoes: 0,
    echoChain: 0,
    core: 0,      // leaves on the Demon Core; 3 echoes make it surge
    surges: 0,     // Core surges so far this duel
    lastElement: null, // strain of the last card played by either side
    lastPlayed: [],    // last 3 played cards, oldest first
    playedCards: [],   // every card played this duel, in order (shown at the end)
    log: [],
    banner: null,      // { text, sub, until } — transient announcement
    floaters: [],      // { text, x, y, color, born, life }
    player: makeSide('VEX — NEON SUMMONER', 'Vex', null, seed),
    ai: makeSide('VOIDREAPER — DEMON CORE', 'Voidreaper', null, seed + 101),
    winner: null,
    best: 0,
  };
  drawCards(g.player, 5);
  drawCards(g.ai, 5);
  g.player.energy = 1; g.player.maxEnergy = 1;
  g.ai.energy = 1; g.ai.maxEnergy = 1;
  pushLog(g, 'The core is lit. Inferno, Volt, Venom, Void — choose wisely.');
  pushLog(g, 'ECHO: match the last strain played and the core answers twice.');
  pushLog(g, 'CORE: every 3rd echo overloads the Demon Core — +4 life, draw 2.');
  return g;
}

export function pushLog(g, text) {
  g.log.unshift(text);
  if (g.log.length > 5) g.log.length = 5;
}

export function drawCards(side, n) {
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (side.hand.length >= MAX_HAND) break;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) break;
      side.deck = shuffle(side.discard, 7 + side.hand.length);
      side.discard = [];
    }
    side.hand.push(side.deck.pop());
    drawn++;
  }
  return drawn;
}

function dealDamage(g, target, amount, sourceName) {
  let left = amount;
  if (target.ward > 0) {
    const absorbed = Math.min(target.ward, left);
    target.ward -= absorbed; left -= absorbed;
    if (absorbed > 0) pushLog(g, `Ward absorbs ${absorbed}.`);
  }
  if (left > 0) {
    target.hp = Math.max(0, target.hp - left);
    if (target === g.ai) { g.damageDealt += left; g.score += left; }
  }
  return left;
}

// Play hand[index] for `side` ('player' | 'ai'). Returns false if illegal.
export function playCard(g, who, index) {
  if (g.screen !== 'duel' || g.phase !== who) return false;
  const side = g[who];
  const foe = g[who === 'player' ? 'ai' : 'player'];
  const card = side.hand[index];
  if (!card || card.cost > side.energy) return false;

  side.energy -= card.cost;
  side.hand.splice(index, 1);
  side.discard.push(card);

  const echo = g.lastElement !== null && card.element === g.lastElement;
  const mult = echo ? 2 : 1;
  const amount = card.power * mult;
  if (echo) {
    g.echoes++;
    g.echoChain++;
    g.score += 5;
    g.core++;
    g.banner = { text: 'ECHO!', sub: `The core answers ${card.element} — effect doubled x2`, until: Date.now() + 1400 };
    if (g.core >= 3) {
      // CORE BLOOM: the Demon Core answers the third echo. The
      // duellist who woke it gains life and draws — a whole second arc
      // built on chasing echoes, not just one doubled card.
      g.core = 0;
      g.surges++;
      g.score += 10;
      const healed = Math.min(4, side.maxHp - side.hp);
      side.hp += healed;
      const drawn = drawCards(side, 2);
      g.banner = { text: 'CORE SURGES!', sub: `The Demon Core answers — +${healed} life, draw ${drawn}`, until: Date.now() + 1800 };
      pushLog(g, `CORE SURGES! ${side.short} gains +${healed} life and draws ${drawn}.`);
    }
  } else {
    g.echoChain = 0;
  }
  g.lastElement = card.element;
  g.lastPlayed.push({ ...card, echo });
  if (g.lastPlayed.length > 3) g.lastPlayed.shift();
  g.playedCards.push({ ...card, echo });

  let line = '';
  if (card.kind === 'damage') {
    const dealt = dealDamage(g, foe, amount, side.name);
    line = `${side.short} plays ${card.name} — ${dealt} damage${echo ? ' (ECHO x2)' : ''}.`;
  } else if (card.kind === 'shield') {
    side.ward += amount;
    line = `${side.short} plays ${card.name} — +${amount} ward${echo ? ' (ECHO x2)' : ''}.`;
  } else if (card.kind === 'heal') {
    const healed = Math.min(amount, side.maxHp - side.hp);
    side.hp += healed;
    line = `${side.short} plays ${card.name} — +${healed} life${echo ? ' (ECHO x2)' : ''}.`;
  } else if (card.kind === 'draw') {
    const n = drawCards(side, amount);
    line = `${side.short} plays ${card.name} — draws ${n} card${n === 1 ? '' : 's'}${echo ? ' (ECHO x2)' : ''}.`;
  }
  pushLog(g, line);
  g.floaters.push({
    text: card.kind === 'damage' ? `-${amount}` : card.kind === 'heal' ? `+${amount}` : `+${amount} ${card.kind}`,
    x: who === 'player' ? 640 : 640, y: who === 'player' ? 300 : 210,
    color: echo ? '#ffd94d' : '#ffffff', born: Date.now(), life: 1100,
  });
  checkEnd(g);
  return true;
}

export function startDuel(g) {
  g.screen = 'duel'; g.phase = 'player'; g.turn = 1;
  g.player.maxEnergy = 1; g.player.energy = 1;
  pushLog(g, 'Turn 1 — your move. Play cards, then end your turn.');
}

export function endPlayerTurn(g) {
  if (g.screen !== 'duel' || g.phase !== 'player') return;
  g.phase = 'ai';
  pushLog(g, 'Voidreaper takes the screen…');
}

export function startAiTurn(g) {
  // New energy for the AI, then it draws. Called by the UI with a beat
  // between plays so the duel reads as a duel, not a spreadsheet.
  // Energy follows the ROUND number, not Voidreaper's own turn count: on round
  // N both duellists have N energy, so going second is not a free +1 core.
  g.ai.maxEnergy = Math.min(MAX_ENERGY, g.turn);
  g.ai.energy = g.ai.maxEnergy;
  const drawn = drawCards(g.ai, 1);
  if (drawn === 0 && g.ai.deck.length === 0 && g.ai.discard.length === 0) {
    g.ai.hp = Math.max(0, g.ai.hp - 2);
    pushLog(g, 'Voidreaper’s deck is empty — the void takes him for 2.');
    checkEnd(g);
  }
}

export function startPlayerTurn(g) {
  g.turn++;
  g.phase = 'player';
  g.player.maxEnergy = Math.min(MAX_ENERGY, g.player.maxEnergy + 1);
  g.player.energy = g.player.maxEnergy;
  const drawn = drawCards(g.player, 1);
  if (drawn === 0 && g.player.deck.length === 0 && g.player.discard.length === 0) {
    g.player.hp = Math.max(0, g.player.hp - 2);
    pushLog(g, 'Your deck is empty — the shadows take you for 2.');
  }
  pushLog(g, `Turn ${g.turn} — your move. Energy refilled to ${g.player.energy}.`);
  checkEnd(g);
}

export function checkEnd(g) {
  if (g.screen !== 'duel') return;
  if (g.ai.hp <= 0) {
    g.screen = 'win'; g.phase = 'over'; g.winner = 'player';
    g.score += 50 + g.player.hp;
    g.banner = null;
    pushLog(g, 'VOIDREAPER FALLS. The grid is yours.');
  } else if (g.player.hp <= 0) {
    g.screen = 'lose'; g.phase = 'over'; g.winner = 'ai';
    g.banner = null;
    pushLog(g, 'Your core burns out. Voidreaper claims the grid.');
  }
}

// What the AI is about to do — shown as its "intent" so the player can
// plan around it instead of guessing. Honest, readable, fair.
export function aiIntent(g) {
  const best = chooseAiCard(g);
  if (!best) return 'Voidreaper passes…';
  const c = best.card;
  const echo = g.lastElement === c.element ? ' · ECHO!' : '';
  if (c.kind === 'damage') return `Intends: ${c.name} (${c.power * (echo ? 2 : 1)} dmg)${echo}`;
  if (c.kind === 'shield') return `Intends: ${c.name} (+${c.power} ward)${echo}`;
  if (c.kind === 'heal') return `Intends: ${c.name} (+${c.power} life)${echo}`;
  return `Intends: ${c.name} (draw ${c.power})${echo}`;
}

export function chooseAiCard(g) {
  const ai = g.ai;
  let best = null;
  ai.hand.forEach((card, index) => {
    if (card.cost > ai.energy) return;
    let value = 0;
    const echo = g.lastElement === card.element;
    const mult = echo ? 2 : 1;
    if (card.kind === 'damage') {
      value = card.power * mult * 2;
      if (ai.hp <= 0) value = 0;
      if (g.player.hp <= card.power * mult) value += 100; // lethal
      if (g.player.ward > 0) value -= 1;
    } else if (card.kind === 'shield') {
      value = ai.hp < 16 ? card.power * mult * 1.6 : card.power * mult * 0.7;
      if (g.player.hp <= 6) value -= 4; // press the attack instead
    } else if (card.kind === 'heal') {
      value = ai.hp < 14 ? card.power * mult * 2 : card.power * mult * 0.3;
      if (ai.hp >= ai.maxHp - 2) value = -5;
    } else if (card.kind === 'draw') {
      value = ai.hand.length <= 3 ? 7 : 2;
    }
    value += echo ? 6 : 0;
    value -= card.cost * 0.4; // prefer cheap efficiency when tied
    if (!best || value > best.value) best = { card, index, value };
  });
  return best && best.value > 0 ? best : null;
}
