// DEMON.EXE — all drawing. Canvas is 2560x1600 backing store for a
// 1280x800 CSS box (2x supersampling); every frame starts with
// ctx.setTransform(2,0,0,2,0,0) and draws in 1280x800 logical pixels.
// Decorative ember motes use hash2(), never Math.random, so two runs of
// the same scene render byte-identical pixels.
import { ELEMENTS, ELEMENT_GLOSS, KIND_LABEL, hash2 } from './cards.js';

export const W = 1280;
export const H = 800;
const SS = 2;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'center', font = 'Georgia, serif') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// Demon glyphs, one per strain — drawn, never emoji, so they render
// identically everywhere:
// Inferno: a flame. Volt: a lightning bolt. Venom: a droplet.
// Void: a watching eye.
function drawElementIcon(ctx, el, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (el === 'Inferno') {
    // flame: a teardrop licking upward
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.5);
    ctx.quadraticCurveTo(x + s * 0.36, y - s * 0.02, x + s * 0.2, y + s * 0.3);
    ctx.quadraticCurveTo(x + s * 0.1, y + s * 0.46, x, y + s * 0.46);
    ctx.quadraticCurveTo(x - s * 0.1, y + s * 0.46, x - s * 0.2, y + s * 0.3);
    ctx.quadraticCurveTo(x - s * 0.36, y - s * 0.02, x, y - s * 0.5);
    ctx.fill();
  } else if (el === 'Volt') {
    // lightning bolt
    ctx.beginPath();
    ctx.moveTo(x + s * 0.12, y - s * 0.5);
    ctx.lineTo(x - s * 0.26, y + s * 0.06);
    ctx.lineTo(x - s * 0.02, y + s * 0.06);
    ctx.lineTo(x - s * 0.14, y + s * 0.5);
    ctx.lineTo(x + s * 0.3, y - s * 0.1);
    ctx.lineTo(x + s * 0.04, y - s * 0.1);
    ctx.closePath(); ctx.fill();
  } else if (el === 'Venom') {
    // droplet: a pointed drop, poison green
    ctx.beginPath();
    ctx.moveTo(x, y - s * 0.48);
    ctx.quadraticCurveTo(x + s * 0.34, y - s * 0.02, x + s * 0.3, y + s * 0.14);
    ctx.quadraticCurveTo(x + s * 0.26, y + s * 0.44, x, y + s * 0.46);
    ctx.quadraticCurveTo(x - s * 0.26, y + s * 0.44, x - s * 0.3, y + s * 0.14);
    ctx.quadraticCurveTo(x - s * 0.34, y - s * 0.02, x, y - s * 0.48);
    ctx.fill();
  } else { // Void: a watching eye
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.42, s * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, s * 0.13, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function handLayout(g) {
  const n = g.player.hand.length;
  const cw = 148, ch = 200, gap = 12;
  const total = n * cw + (n - 1) * gap;
  const x0 = (W - total) / 2;
  return g.player.hand.map((card, i) => ({ card, x: x0 + i * (cw + gap), y: 578, w: cw, h: ch, index: i }));
}

export function computeLayout(g) {
  const L = {
    hand: handLayout(g),
    endTurn: { x: 1010, y: 398, w: 230, h: 56 },
    start: { x: 490, y: 628, w: 300, h: 64 },
    again: { x: 440, y: 430, w: 200, h: 56 },
    toTitle: { x: 660, y: 430, w: 200, h: 56 },
    mute: { x: 1196, y: 10, w: 72, h: 32 },
    help: { x: 490, y: 700, w: 300, h: 18 },
  };
  return L;
}

function drawCardFace(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const echo = !!opts.echo;
  const playable = opts.playable !== false;
  ctx.save();
  if (echo) {
    ctx.shadowColor = '#ff2a4d'; ctx.shadowBlur = 26;
  } else if (!playable) {
    ctx.globalAlpha = 0.55;
  }
  rr(ctx, x, y, w, h, 12);
  // card face: a gradient in its own strain's colours, never plain white
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, el.bg0); grad.addColorStop(1, el.bg1);
  ctx.fillStyle = grad; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = echo ? 4 : 2;
  ctx.strokeStyle = echo ? '#ff2a4d' : el.color;
  ctx.stroke();
  // element band
  rr(ctx, x + 6, y + 6, w - 12, 34, 8);
  ctx.fillStyle = el.dark; ctx.fill();
  text(ctx, card.element.toUpperCase(), x + w / 2 + 12, y + 24, 13, el.light, 'bold', 'center', 'system-ui, sans-serif');
  drawElementIcon(ctx, card.element, x + 24, y + 23, 18, el.light);
  // cost orb
  ctx.beginPath(); ctx.arc(x + 26, y + h * 0.31, 17, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0508'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#ff8fa3'; ctx.stroke();
  text(ctx, String(card.cost), x + 26, y + h * 0.31 + 1, 20, '#ff8fa3');
  text(ctx, 'ENERGY', x + 26, y + h * 0.31 + 24, 8, '#a89a9e', 'bold', 'center', 'system-ui, sans-serif');
  // watermark: the strain's demon glyph, large and faint, behind the power
  ctx.globalAlpha = 0.20;
  drawElementIcon(ctx, card.element, x + w / 2 + 10, y + h * 0.52, 92, el.color);
  ctx.globalAlpha = 1;
  // power — the big readable number
  text(ctx, String(card.power), x + w / 2 + 10, y + h * 0.52, 52, '#ffffff');
  text(ctx, KIND_LABEL[card.kind], x + w / 2 + 10, y + h * 0.70, 11, '#d8c9a8', 'bold', 'center', 'system-ui, sans-serif');
  // name + text
  text(ctx, card.name, x + w / 2, y + h * 0.84, 13, '#f3e9d2', 'bold');
  ctx.fillStyle = '#c9b8a0';
  ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(card.text, x + w / 2, y + h * 0.94);
  if (echo) {
    rr(ctx, x - 4, y - 14, 74, 24, 12);
    ctx.fillStyle = '#ff2a4d'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = '#7a0a1e'; ctx.stroke();
    text(ctx, 'ECHO x2', x + 33, y - 1, 12, '#ffffff', 'bold', 'center', 'system-ui, sans-serif');
  }
  ctx.restore();
}

function drawMiniCard(ctx, card, x, y, w, h) {
  const el = ELEMENTS[card.element];
  rr(ctx, x, y, w, h, 8);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, el.bg0); grad.addColorStop(1, el.bg1);
  ctx.fillStyle = grad; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = el.color; ctx.stroke();
  ctx.globalAlpha = 0.20;
  drawElementIcon(ctx, card.element, x + w / 2, y + h * 0.32, 34, el.color);
  ctx.globalAlpha = 1;
  drawElementIcon(ctx, card.element, x + w / 2, y + h * 0.32, 22, el.color);
  text(ctx, String(card.power), x + w / 2, y + h * 0.68, 22, '#ffffff');
  text(ctx, card.element, x + w / 2, y + h * 0.88, 9, '#d8c9a8', 'bold', 'center', 'system-ui, sans-serif');
}

// A hexagonal ring, flat-top — the futuristic frame for medallions.
function hexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// The demon behind the title: a red ring, two horns, glowing eyes.
// Drawn faint, behind everything — a silhouette on the black.
function drawDemon(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 42, 77, 0.30)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(x, y, 205, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 42, 77, 0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, 218, 0, Math.PI * 2); ctx.stroke();
  // horns: two curved blades rising from the head, red-edged so they read
  ctx.fillStyle = 'rgba(20, 3, 8, 0.85)';
  ctx.strokeStyle = 'rgba(255, 42, 77, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - 52, y - 18);
  ctx.quadraticCurveTo(x - 122, y - 96, x - 100, y - 192);
  ctx.quadraticCurveTo(x - 64, y - 96, x - 28, y - 52);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 52, y - 18);
  ctx.quadraticCurveTo(x + 122, y - 96, x + 100, y - 192);
  ctx.quadraticCurveTo(x + 64, y - 96, x + 28, y - 52);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // head: a dark mass between the horns, rimmed in red so the shape reads
  ctx.fillStyle = 'rgba(20, 3, 8, 0.85)';
  ctx.strokeStyle = 'rgba(255, 42, 77, 0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 58, y - 40);
  ctx.quadraticCurveTo(x - 62, y + 52, x, y + 66);
  ctx.quadraticCurveTo(x + 62, y + 52, x + 58, y - 40);
  ctx.quadraticCurveTo(x, y - 72, x - 58, y - 40);
  ctx.fill(); ctx.stroke();
  // glowing eyes
  ctx.fillStyle = 'rgba(255, 42, 77, 0.9)';
  ctx.shadowColor = '#ff2a4d'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(x - 26, y - 12, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 26, y - 12, 7, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawHpBar(ctx, x, y, w, hp, maxHp, ward, label, color) {
  text(ctx, label, x, y - 2, 15, '#f3e9d2', 'bold', 'left');
  const bw = w;
  rr(ctx, x, y + 12, bw, 22, 11);
  ctx.fillStyle = '#1a0f2e'; ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  if (frac > 0) {
    rr(ctx, x + 2, y + 14, Math.max(18, (bw - 4) * frac), 18, 9);
    const grad = ctx.createLinearGradient(x, y, x + bw, y);
    grad.addColorStop(0, color); grad.addColorStop(1, '#ff8fa3');
    ctx.fillStyle = grad; ctx.fill();
  }
  text(ctx, `${hp} / ${maxHp}`, x + bw / 2, y + 23, 15, '#ffffff', 'bold', 'center', 'system-ui, sans-serif');
  if (ward > 0) {
    rr(ctx, x + bw + 10, y + 12, 74, 22, 11);
    ctx.fillStyle = '#123f2a'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = '#4caf7d'; ctx.stroke();
    text(ctx, `WARD ${ward}`, x + bw + 47, y + 23, 12, '#bdeeda', 'bold', 'center', 'system-ui, sans-serif');
  }
}

function drawBackground(ctx, g, now) {
  const grad = ctx.createRadialGradient(640, 340, 60, 640, 400, 900);
  grad.addColorStop(0, '#2a0608'); grad.addColorStop(0.55, '#12040a'); grad.addColorStop(1, '#050308');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  // deterministic ember motes drifting up
  for (let i = 0; i < 42; i++) {
    const hx = hash2(i, 3, 1); const hy = hash2(i, 7, 2); const hs = hash2(i, 11, 3);
    const speed = 12 + hs * 22;
    const yy = H - ((hy * H + (now / 1000) * speed) % H);
    const xx = hx * W + Math.sin((now / 1000 + i) * 0.5) * 8;
    ctx.globalAlpha = 0.12 + hs * 0.3;
    ctx.fillStyle = hs > 0.6 ? '#ff2a4d' : '#ff2a4d';
    ctx.beginPath(); ctx.arc(xx, yy, 1 + hs * 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // the grid screen — the glowing arena the demons play on
  rr(ctx, 24, 60, W - 48, H - 84, 18);
  ctx.fillStyle = 'rgba(60, 8, 16, 0.35)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255, 42, 77, 0.45)'; ctx.stroke();
  // circuit dots along the screen's edge — the arena's circuit border
  for (let i = 0; i < 44; i++) {
    const bx = 44 + i * 28;
    const by = 74 + hash2(i, 5, 9) * 4;
    ctx.globalAlpha = 0.10 + hash2(i, 6, 9) * 0.10;
    ctx.fillStyle = '#ff8fa3';
    ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(bx, H - 74 - hash2(i, 7, 9) * 4, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTopBar(ctx, g, muted) {
  ctx.fillStyle = 'rgba(8, 2, 6, 0.92)'; ctx.fillRect(0, 0, W, 52);
  ctx.fillStyle = '#ff2a4d'; ctx.fillRect(0, 52, W, 2);
  text(ctx, 'DEMON.EXE', 28, 27, 22, '#ff8fa3', 'bold', 'left');
  text(ctx, 'A NEON DEMON DUEL', 182, 28, 11, '#a89a9e', 'bold', 'left', 'system-ui, sans-serif');
  if (g.screen === 'duel') {
    text(ctx, `TURN ${g.turn}`, 640, 27, 16, '#f3e9d2', 'bold', 'center', 'system-ui, sans-serif');
    text(ctx, `SCORE ${g.score}`, 820, 27, 16, '#ff2a4d', 'bold', 'center', 'system-ui, sans-serif');
    text(ctx, `ECHOES ${g.echoes}`, 960, 27, 14, '#c9b3ef', 'bold', 'center', 'system-ui, sans-serif');
  }
  rr(ctx, 1196, 10, 72, 32, 8);
  ctx.fillStyle = '#1a0508'; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = '#ff2a4d'; ctx.stroke();
  text(ctx, muted ? 'SOUND: OFF' : 'SOUND: ON', 1232, 27, 11, '#f3e9d2', 'bold', 'center', 'system-ui, sans-serif');
}

function drawTitle(ctx, g) {
  // the grid screen itself: a warm core glow behind the title, with two
  // giant demon glyphs standing at its sides like sigils on the grid
  const glow = ctx.createRadialGradient(640, 300, 40, 640, 300, 460);
  glow.addColorStop(0, 'rgba(255, 42, 77, 0.20)'); glow.addColorStop(1, 'rgba(255, 42, 77, 0)');
  ctx.fillStyle = glow; ctx.fillRect(120, 60, 1040, 700);
  ctx.globalAlpha = 0.08;
  drawElementIcon(ctx, 'Volt', 185, 330, 210, '#ff8fa3');
  drawElementIcon(ctx, 'Void', 1095, 330, 210, '#ff8fa3');
  drawElementIcon(ctx, 'Venom', 185, 620, 150, '#ff8fa3');
  drawElementIcon(ctx, 'Inferno', 1095, 620, 150, '#ff8fa3');
  ctx.globalAlpha = 1;
  // the demon behind the title: a red ring, two horns, glowing eyes
  drawDemon(ctx, 640, 285);
  // four demon strains: Inferno, Volt, Venom, Void
  const els = ['Inferno', 'Volt', 'Venom', 'Void'];
  els.forEach((el, i) => {
    const x = 400 + i * 160; const y = 196;
    hexPath(ctx, x, y, 48);
    ctx.fillStyle = ELEMENTS[el].dark; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = ELEMENTS[el].color; ctx.stroke();
    drawElementIcon(ctx, el, x, y, 44, ELEMENTS[el].light);
    text(ctx, el.toUpperCase(), x, y + 66, 13, ELEMENTS[el].color, 'bold', 'center', 'system-ui, sans-serif');
    text(ctx, ELEMENT_GLOSS[el], x, y + 86, 10, '#a89a9e', 'bold', 'center', 'system-ui, sans-serif');
  });
  text(ctx, 'DEMON.EXE', 640, 348, 92, '#f3e9d2', 'bold');
  text(ctx, 'A neon demon card duel.  Bite. Play. Dominate.', 640, 404, 20, '#f3e9d2', 'normal', 'center', 'Georgia, serif');
  // Echo + Core rule box — the original mechanics, front and centre
  rr(ctx, 340, 428, 600, 118, 6);
  ctx.fillStyle = 'rgba(255, 42, 77, 0.10)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#ff2a4d'; ctx.stroke();
  text(ctx, 'THE ECHO RULE', 640, 452, 16, '#ff2a4d', 'bold', 'center', 'system-ui, sans-serif');
  text(ctx, 'Play a card whose strain matches the last card played —', 640, 478, 15, '#f3e9d2');
  text(ctx, 'by either summoner — and its effect strikes TWICE.', 640, 500, 15, '#f3e9d2');
  text(ctx, 'CORE: every 3rd echo overloads the Demon Core — +4 life, draw 2.', 640, 526, 13, '#8fce6e', 'bold', 'center', 'system-ui, sans-serif');
  // Start button — dark plate, red neon edge, like the reference
  const L = computeLayout(g);
  rr(ctx, L.start.x, L.start.y, L.start.w, L.start.h, 6);
  ctx.fillStyle = '#1a0508'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#ff2a4d'; ctx.stroke();
  text(ctx, 'ENTER THE ARENA', 640, L.start.y + 33, 24, '#ff8fa3', 'bold', 'center', 'system-ui, sans-serif');
  text(ctx, 'You: 30 life  ·  Voidreaper: 30 life  ·  First to 0 loses  ·  Click or press Enter', 640, 716, 13, '#a89a9e', 'normal', 'center', 'system-ui, sans-serif');
  text(ctx, 'Cards cost Energy — you gain +1 max Energy every turn.  1–7 play cards, Space ends turn.', 640, 740, 13, '#a89a9e', 'normal', 'center', 'system-ui, sans-serif');
}

function drawDuel(ctx, g, now) {
  const L = computeLayout(g);
  // --- Opponent: Voidreaper, the Shadow King ---
  ctx.beginPath(); ctx.arc(84, 128, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#1a0508'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = '#ff5f7a'; ctx.stroke();
  text(ctx, 'V', 84, 130, 40, '#ff8fa3');
  drawHpBar(ctx, 148, 96, 300, g.ai.hp, g.ai.maxHp, g.ai.ward, 'VOIDREAPER — DEMON CORE', '#ff5f7a');
  text(ctx, `DECK ${g.ai.deck.length}  ·  HAND ${g.ai.hand.length}`, 148, 150, 12, '#a89a9e', 'bold', 'left', 'system-ui, sans-serif');
  // opponent face-down hand
  g.ai.hand.forEach((_, i) => {
    const x = 520 + i * 62; const y = 78;
    rr(ctx, x, y, 54, 76, 8);
    ctx.fillStyle = '#1a0508'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#ff2a4d'; ctx.stroke();
    drawElementIcon(ctx, 'Volt', x + 27, y + 38, 26, '#ff2a4d');
  });
  text(ctx, 'VOIDREAPER’S HAND — FACE DOWN', 520, 172, 11, '#a89a9e', 'bold', 'left', 'system-ui, sans-serif');
  // intent box
  rr(ctx, 900, 78, 340, 76, 12);
  ctx.fillStyle = 'rgba(255, 95, 122, 0.12)'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#ff5f7a'; ctx.stroke();
  text(ctx, 'VOIDREAPER’S INTENT — NEXT TURN', 920, 100, 12, '#ff8fa3', 'bold', 'left', 'system-ui, sans-serif');
  ctx.fillStyle = '#f3e9d2'; ctx.font = '15px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const intent = g._intent || '';
  ctx.fillText(intent.length > 46 ? intent.slice(0, 46) + '…' : intent, 920, 128);
  // --- Centre: Echo Row / last played ---
  text(ctx, 'ECHO ROW — LAST PLAYED', 40, 208, 13, '#ff8fa3', 'bold', 'left', 'system-ui, sans-serif');
  if (g.lastPlayed.length === 0) {
    text(ctx, 'No card played yet. Open the duel — set the strain.', 40, 300, 15, '#a89a9e', 'normal', 'left');
  } else {
    g.lastPlayed.forEach((c, i) => {
      drawMiniCard(ctx, c, 48 + i * 108, 224, 96, 128);
      if (c.echo) text(ctx, 'ECHO x2', 96 + i * 108, 368, 12, '#ff2a4d', 'bold', 'center', 'system-ui, sans-serif');
    });
  }
  text(ctx, 'Match this strain to ECHO your card (effect x2).', 40, 396, 13, '#a89a9e', 'normal', 'left', 'system-ui, sans-serif');
  // battle log — three short lines under the Fate Row, clear of the banner
  g.log.slice(0, 3).forEach((line, i) => {
    const short = line.length > 58 ? line.slice(0, 58) + '…' : line;
    text(ctx, short, 40, 422 + i * 20, 12, i === 0 ? '#f3e9d2' : '#a89a9e', 'normal', 'left', 'system-ui, sans-serif');
  });
  // big last card, centre
  const last = g.lastPlayed[g.lastPlayed.length - 1];
  if (last) {
    text(ctx, 'LAST CARD', 640, 208, 13, '#ff8fa3', 'bold', 'center', 'system-ui, sans-serif');
    drawCardFace(ctx, last, 550, 224, 180, 240, { echo: last.echo });
  } else {
    rr(ctx, 550, 224, 180, 240, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fill();
    ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeStyle = '#ff2a4d'; ctx.stroke(); ctx.setLineDash([]);
    text(ctx, '—', 640, 344, 40, '#ff2a4d');
  }
  // --- Right: energy + end turn ---
  text(ctx, 'YOUR ENERGY', 1010, 208, 13, '#ff8fa3', 'bold', 'left', 'system-ui, sans-serif');
  for (let i = 0; i < g.player.maxEnergy; i++) {
    const x = 1022 + i * 22; const y = 248;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < g.player.energy ? '#ff2a4d' : '#3a0d16'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = '#ff8fa3'; ctx.stroke();
  }
  text(ctx, `${g.player.energy} / ${g.player.maxEnergy} energy`, 1010, 282, 14, '#f3e9d2', 'bold', 'left', 'system-ui, sans-serif');
  text(ctx, `Damage dealt: ${g.damageDealt}   ·   Echo chain: ${g.echoChain}`, 1010, 310, 12, '#a89a9e', 'normal', 'left', 'system-ui, sans-serif');
  // Core — the Demon Core. Three leaves; the third echo surges it.
  text(ctx, 'CORE — DEMON CORE', 1010, 336, 13, '#8fce6e', 'bold', 'left', 'system-ui, sans-serif');
  for (let i = 0; i < 3; i++) {
    const x = 1022 + i * 26; const y = 362;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < g.core ? '#8fce6e' : '#2a2a1a'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = '#8fce6e'; ctx.stroke();
  }
  text(ctx, `Surges: ${g.surges}  ·  Next surge at 3 echoes: +4 life, draw 2`, 1010, 386, 11, '#a89a9e', 'normal', 'left', 'system-ui, sans-serif');
  // End turn button
  const et = L.endTurn;
  const canEnd = g.phase === 'player';
  rr(ctx, et.x, et.y, et.w, et.h, 6);
  ctx.fillStyle = canEnd ? '#1a0508' : '#3a0d16'; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#ff2a4d'; ctx.stroke();
  text(ctx, g.phase === 'ai' ? 'VOIDREAPER IS PLAYING…' : 'END TURN  [SPACE]', et.x + et.w / 2, et.y + 29, 18, canEnd ? '#ffffff' : '#a89a9e', 'bold', 'center', 'system-ui, sans-serif');
  // --- Player: you ---
  drawHpBar(ctx, 40, 540, 300, g.player.hp, g.player.maxHp, g.player.ward, `VEX — NEON SUMMONER  ·  DECK ${g.player.deck.length} · DISCARD ${g.player.discard.length}`, '#ff2a4d');
  // hand
  L.hand.forEach((slot) => {
    const echo = g.lastElement !== null && slot.card.element === g.lastElement;
    const playable = slot.card.cost <= g.player.energy && g.phase === 'player';
    drawCardFace(ctx, slot.card, slot.x, slot.y, slot.w, slot.h, { echo, playable });
    text(ctx, String(slot.index + 1), slot.x + slot.w / 2, slot.y + slot.h + 14, 12, '#a89a9e', 'bold', 'center', 'system-ui, sans-serif');
  });
  // floaters
  g.floaters.forEach((f) => {
    const age = (now - f.born) / f.life;
    if (age >= 1) return;
    ctx.globalAlpha = 1 - age;
    text(ctx, f.text, f.x, f.y - age * 46, 30, f.color, 'bold', 'center', 'system-ui, sans-serif');
    ctx.globalAlpha = 1;
  });
  // echo banner
  if (g.banner && now < g.banner.until) {
    const bx = 390; const by = 470; const bw = 500; const bh = 54;
    rr(ctx, bx, by, bw, bh, 6);
    ctx.fillStyle = '#ff2a4d'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#7a0a1e'; ctx.stroke();
    text(ctx, g.banner.text, 640, by + 20, 24, '#ffffff', 'bold', 'center', 'system-ui, sans-serif');
    text(ctx, g.banner.sub, 640, by + 42, 12, '#ffffff', 'normal', 'center', 'system-ui, sans-serif');
  }
}

function drawEndScreen(ctx, g, won) {
  ctx.fillStyle = 'rgba(5, 2, 12, 0.86)'; ctx.fillRect(0, 0, W, H);
  // the dimmed duel behind the panel, lit by one last core glow
  const oGlow = ctx.createRadialGradient(640, 380, 40, 640, 380, 520);
  oGlow.addColorStop(0, 'rgba(255, 42, 77, 0.10)'); oGlow.addColorStop(1, 'rgba(255, 42, 77, 0)');
  ctx.fillStyle = oGlow; ctx.fillRect(0, 0, W, H);
  const px = 290; const py = 100; const pw = 700; const ph = 540;
  rr(ctx, px, py, pw, ph, 20);
  // panel: a gradient in the outcome's colours, lit from the core above
  const pgrad = ctx.createLinearGradient(px, py, px, py + ph);
  pgrad.addColorStop(0, won ? '#2a0a12' : '#1a0508'); pgrad.addColorStop(1, won ? '#12040a' : '#0a0204');
  ctx.fillStyle = pgrad; ctx.fill();
  ctx.save(); rr(ctx, px, py, pw, ph, 20); ctx.clip();
  const pglow = ctx.createRadialGradient(640, py + 40, 20, 640, py + 40, 380);
  pglow.addColorStop(0, 'rgba(255, 42, 77, 0.16)'); pglow.addColorStop(1, 'rgba(255, 42, 77, 0)');
  ctx.fillStyle = pglow; ctx.fillRect(px, py, pw, ph);
  ctx.globalAlpha = 0.06;
  drawElementIcon(ctx, won ? 'Volt' : 'Inferno', 640, py + 330, 320, '#ff8fa3');
  ctx.globalAlpha = 1;
  // circuit dots along the panel's top edge
  for (let i = 0; i < 22; i++) {
    const bx = px + 26 + i * 30;
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#ff8fa3';
    ctx.beginPath(); ctx.arc(bx, py + 16, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.lineWidth = 3; ctx.strokeStyle = won ? '#ff2a4d' : '#ff5f7a'; ctx.stroke();
  text(ctx, won ? 'VICTORY' : 'DEFEAT', 640, py + 62, 64, won ? '#ffffff' : '#ff5f7a');
  text(ctx, won ? 'Voidreaper falls. The grid is yours.' : 'Your core burns out. Voidreaper claims the grid.', 640, py + 116, 18, '#f3e9d2');
  const rows = [
    ['FINAL SCORE', String(g.score)],
    ['TURNS PLAYED', String(g.turn)],
    ['DAMAGE DEALT', String(g.damageDealt)],
    ['ECHOES TRIGGERED', String(g.echoes)],
    ['CORE SURGES', String(g.surges)],
    ['YOUR LIFE LEFT', `${g.player.hp} / ${g.player.maxHp}`],
    ['VOIDREAPER’S LIFE LEFT', `${g.ai.hp} / ${g.ai.maxHp}`],
  ];
  rows.forEach((r, i) => {
    const y = py + 150 + i * 26;
    text(ctx, r[0], 380, y, 15, '#a89a9e', 'bold', 'left', 'system-ui, sans-serif');
    text(ctx, r[1], 900, y, 18, '#ff8fa3', 'bold', 'right', 'system-ui, sans-serif');
  });
  const L = computeLayout(g);
  [L.again, L.toTitle].forEach((b, i) => {
    rr(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = i === 0 ? '#ff2a4d' : '#1a0508'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#ff8fa3'; ctx.stroke();
    text(ctx, i === 0 ? 'PLAY AGAIN  [R]' : 'TITLE  [T]', b.x + b.w / 2, b.y + 29, 16, i === 0 ? '#ffffff' : '#f3e9d2', 'bold', 'center', 'system-ui, sans-serif');
  });
  text(ctx, 'The grid remembers every echo.', 640, py + 406, 13, '#a89a9e', 'normal', 'center', 'system-ui, sans-serif');
  // the cards that wrote this duel — the last ten played, as mini cards
  const played = (g.playedCards || []).slice(-10);
  text(ctx, 'CARDS PLAYED THIS DUEL', 640, py + 428, 12, '#a89a9e', 'bold', 'center', 'system-ui, sans-serif');
  const mw = 56, mh = 76, mgap = 8;
  const total = played.length * mw + Math.max(0, played.length - 1) * mgap;
  let mx = (1280 - total) / 2;
  played.forEach(c => {
    drawMiniCard(ctx, c, mx, py + 440, mw, mh);
    if (c.echo) text(ctx, 'ECHO', mx + mw / 2, py + 440 + mh + 10, 8, '#ff2a4d', 'bold', 'center', 'system-ui, sans-serif');
    mx += mw + mgap;
  });
}

export function render(ctx, g, muted, now = Date.now()) {
  ctx.setTransform(SS, 0, 0, SS, 0, 0);
  drawBackground(ctx, g, now);
  drawTopBar(ctx, g, muted);
  if (g.screen === 'title') drawTitle(ctx, g);
  else if (g.screen === 'duel') drawDuel(ctx, g, now);
  else if (g.screen === 'win') { drawDuel(ctx, g, now); drawEndScreen(ctx, g, true); }
  else if (g.screen === 'lose') { drawDuel(ctx, g, now); drawEndScreen(ctx, g, false); }
  // prune expired floaters
  g.floaters = g.floaters.filter((f) => now - f.born < f.life);
}
