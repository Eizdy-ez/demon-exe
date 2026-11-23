// DEMON.EXE — procedural WebAudio. No sound files, no network:
// every effect is a small oscillator envelope built on the fly.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
  if (muted) return;
  const c = ac(); if (!c) return;
  const t0 = c.currentTime + when;
  const o = c.createOscillator(); const gn = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gn.gain.setValueAtTime(0.0001, t0);
  gn.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn); gn.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export const sfx = {
  play() { tone(520, 0.12, 'triangle', 0.10); tone(780, 0.14, 'triangle', 0.08, 0.05); },
  echo() { tone(660, 0.12, 'square', 0.07); tone(990, 0.16, 'square', 0.07, 0.07); tone(1320, 0.2, 'sine', 0.09, 0.14); },
  hit() { tone(180, 0.18, 'sawtooth', 0.12, 0, 70); },
  heal() { tone(440, 0.2, 'sine', 0.09, 0, 660); tone(660, 0.22, 'sine', 0.07, 0.1, 880); },
  ward() { tone(300, 0.2, 'triangle', 0.09, 0, 420); },
  draw() { tone(880, 0.08, 'sine', 0.06); },
  turn() { tone(392, 0.1, 'triangle', 0.07); },
  bad() { tone(140, 0.15, 'square', 0.06); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, 'triangle', 0.1, i * 0.13)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.07, i * 0.15)); },
  click() { tone(700, 0.05, 'sine', 0.05); },
};
