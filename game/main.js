// DEMON.EXE — wiring: input, turn flow, animation loop.
// The AI turn runs on a timer so each of Voidreaper's cards is seen landing.
import { createGame, startDuel, playCard, endPlayerTurn, startAiTurn, startPlayerTurn, aiIntent } from './state.js';
import { planAiTurn, aiPlayStep } from './ai.js';
import { render, computeLayout, W, H } from './render.js';
import { sfx, toggleMute, isMuted } from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || '20261123');
let g = createGame(seed);
let aiPlan = [];
let aiTimer = null;
let shotMode = false;

function refreshIntent() {
  g._intent = g.screen === 'duel' ? aiIntent(g) : '';
}

function loop() {
  refreshIntent();
  render(ctx, g, isMuted());
  requestAnimationFrame(loop);
}

function restart() {
  clearTimeout(aiTimer); aiPlan = [];
  const best = g.best;
  g = createGame(seed + Math.floor(Date.now() % 997));
  g.best = best;
  g.screen = 'title';
  refreshIntent();
}

function beginDuel() {
  startDuel(g);
  sfx.turn();
  refreshIntent();
}

function runAiTurn() {
  startAiTurn(g);
  aiPlan = planAiTurn(g);
  const step = () => {
    if (g.screen !== 'duel' || g.phase !== 'ai') return;
    const next = aiPlan.shift();
    if (!next) {
      startPlayerTurn(g);
      sfx.turn();
      return;
    }
    const beforeEchoes = g.echoes;
    const ok = aiPlayStep(g, next);
    if (ok) {
      const played = g.lastPlayed[g.lastPlayed.length - 1];
      if (played && played.echo) sfx.echo();
      else if (played) sfx.play();
    }
    if (g.screen !== 'duel') { endFanfare(); return; }
    aiTimer = setTimeout(step, 900);
  };
  aiTimer = setTimeout(step, 700);
}

function endFanfare() {
  if (g.screen === 'win') sfx.win();
  if (g.screen === 'lose') sfx.lose();
}

function endTurn() {
  if (g.screen !== 'duel' || g.phase !== 'player') return;
  endPlayerTurn(g);
  sfx.turn();
  runAiTurn();
}

function playHand(index) {
  if (g.screen !== 'duel' || g.phase !== 'player') return;
  const card = g.player.hand[index];
  if (!card) return;
  if (card.cost > g.player.energy) { sfx.bad(); return; }
  const beforeEchoes = g.echoes;
  if (playCard(g, 'player', index)) {
    if (g.echoes > beforeEchoes) sfx.echo();
    else if (card.kind === 'heal') sfx.heal();
    else if (card.kind === 'shield') sfx.ward();
    else if (card.kind === 'draw') sfx.draw();
    else sfx.hit();
    if (g.screen === 'win' || g.screen === 'lose') endFanfare();
  }
}

function pointIn(r, x, y) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (W / rect.width);
  const y = (e.clientY - rect.top) * (H / rect.height);
  const L = computeLayout(g);
  if (pointIn(L.mute, x, y)) { toggleMute(); sfx.click(); return; }
  if (g.screen === 'title') {
    if (pointIn(L.start, x, y)) { sfx.click(); beginDuel(); }
    return;
  }
  if (g.screen === 'win' || g.screen === 'lose') {
    if (pointIn(L.again, x, y)) { sfx.click(); restart(); }
    else if (pointIn(L.toTitle, x, y)) { sfx.click(); restart(); }
    return;
  }
  if (g.screen === 'duel') {
    if (pointIn(L.endTurn, x, y)) { endTurn(); return; }
    for (const slot of L.hand) {
      if (pointIn(slot, x, y)) { playHand(slot.index); return; }
    }
  }
});

const pressedQueue = [];
window.addEventListener('keydown', (e) => { pressedQueue.push(e.key.toLowerCase()); });
function pumpKeys() {
  while (pressedQueue.length) {
    const k = pressedQueue.shift();
    if (k === 'm') { toggleMute(); continue; }
    if (g.screen === 'title' && (k === 'enter' || k === ' ')) { beginDuel(); continue; }
    if ((g.screen === 'win' || g.screen === 'lose') && (k === 'r' || k === 'enter')) { restart(); continue; }
    if ((g.screen === 'win' || g.screen === 'lose') && k === 't') { restart(); continue; }
    if (g.screen === 'duel') {
      if (k === ' ' || k === 'e') { endTurn(); continue; }
      if (k === 'r') { restart(); continue; }
      const n = Number(k);
      if (n >= 1 && n <= 7) playHand(n - 1);
    }
  }
  setTimeout(pumpKeys, 30);
}

// Screenshot scenes (?shot=...) set a fixed, deterministic state.
if (params.get('shot')) {
  shotMode = true;
  const hint = document.getElementById('hint');
  if (hint) hint.style.display = 'none';
  document.getElementById('wrap').style.padding = '0';
  applyShot(g, params.get('shot'));
  refreshIntent();
  // Frozen clock: energys sit in one deterministic place, so the same
  // scene renders identical pixels on every capture.
  render(ctx, g, false, 1790000000000);
  document.title = `DEMON.EXE — shot ${params.get('shot')}`;
} else {
  if (params.get('debug')) window.__energy = () => g;
  pumpKeys();
  loop();
}
