// DEMON.EXE — Voidreaper's brain. One greedy pass over her hand, scored by
// the same rules the player sees: lethal first, heal when hurt, ward when
// threatened, and always take an Echo when it is on the table.
import { chooseAiCard, playCard } from './state.js';

// Play Voidreaper's whole turn as a list of { index } steps the UI performs
// one beat at a time, so each card is visible as it lands.
export function planAiTurn(g) {
  const steps = [];
  // Simulate on a shallow copy of the spendable state: track energy + hand
  // as cards are "spent" so the plan never double-spends one card.
  let energy = g.ai.energy;
  const hand = g.ai.hand.slice();
  let lastElement = g.lastElement;
  for (let guard = 0; guard < 8; guard++) {
    // Temporarily point the chooser at the simulated hand/energy.
    const savedHand = g.ai.hand; const savedEnergy = g.ai.energy; const savedLast = g.lastElement;
    g.ai.hand = hand; g.ai.energy = energy; g.lastElement = lastElement;
    const pick = chooseAiCard(g);
    g.ai.hand = savedHand; g.ai.energy = savedEnergy; g.lastElement = savedLast;
    if (!pick) break;
    steps.push({ uid: pick.card.uid });
    energy -= pick.card.cost;
    hand.splice(hand.findIndex((c) => c.uid === pick.card.uid), 1);
    lastElement = pick.card.element;
  }
  return steps;
}

// Resolve one planned step against the live game (index may have shifted).
export function aiPlayStep(g, step) {
  const idx = g.ai.hand.findIndex((c) => c.uid === step.uid);
  if (idx === -1) return false;
  return playCard(g, 'ai', idx);
}
