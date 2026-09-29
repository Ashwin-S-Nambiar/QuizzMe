import { createPersistedStore } from './store.js';

export const soundStore = createPersistedStore('qz:sound', true);

let ctx = null;
let out = null;
let noise = null;

function audio() {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
    return null;
  }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
    ctx = new AC();
    // One soft limiter on the way out, so stacked notes never clip.
    out = ctx.createDynamicsCompressor();
    out.threshold.value = -18;
    out.ratio.value = 6;
    out.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
    return null;
  }
  return ctx;
}

function envelope(c, t, gain, attack, dur) {
  const amp = c.createGain();
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  amp.connect(out);
  return amp;
}

// A plain voice with an optional pitch glide.
function tone({ freq, to, dur, type = 'sine', gain = 0.06, delay = 0 }) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  osc.connect(envelope(c, t, gain, 0.005, dur));
  osc.start(t);
  osc.stop(t + dur + 0.03);
}

// A struck wooden bar: a sine fundamental plus a quick, quiet overtone four
// times higher, the way a marimba sounds.
function mallet({ freq, dur = 0.5, gain = 0.08, delay = 0 }) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  for (const [mult, g, d] of [
    [1, gain, dur],
    [4, gain * 0.28, dur * 0.22],
  ]) {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * mult, t);
    osc.connect(envelope(c, t, g, 0.003, d));
    osc.start(t);
    osc.stop(t + d + 0.03);
  }
}

// Filtered noise: the flick of a card edge, or the brush of one sliding.
function flick({
  freq = 2600,
  to,
  q = 1.2,
  dur = 0.06,
  gain = 0.05,
  delay = 0,
}) {
  const c = audio();
  if (!c) return;
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + delay;
  const src = c.createBufferSource();
  src.buffer = noise;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = q;
  band.frequency.setValueAtTime(freq, t);
  if (to) band.frequency.exponentialRampToValueAtTime(to, t + dur);
  src.connect(band).connect(envelope(c, t, gain, 0.004, dur));
  src.start(t, Math.random() * 0.3);
  src.stop(t + dur + 0.03);
}

const semitone = (base, n) => base * 2 ** (n / 12);

const play =
  (fn) =>
  (...args) => {
    if (!soundStore.get() || document.hidden) return;
    try {
      fn(...args);
    } catch {}
  };

export const sfx = {
  // A chunky key: a short woody knock with a little body under it.
  tap: play(() => {
    tone({ freq: 640, to: 420, dur: 0.045, type: 'triangle', gain: 0.045 });
    tone({ freq: 190, to: 140, dur: 0.05, gain: 0.03 });
  }),
  // Choosing a chip or an answer to lock in later: a rounder, rising pop.
  select: play(() => {
    tone({ freq: 520, to: 880, dur: 0.07, gain: 0.05 });
    tone({ freq: 180, dur: 0.04, gain: 0.02 });
  }),
  pick: play(() => {
    mallet({ freq: 880, dur: 0.18, gain: 0.055 });
  }),
  // Dealing: a quick riffle of four card flicks.
  deal: play(() => {
    for (let i = 0; i < 4; i++) {
      flick({ freq: 2200 + i * 300, dur: 0.05, gain: 0.05, delay: i * 0.045 });
    }
    tone({ freq: 200, to: 150, dur: 0.06, gain: 0.025 });
  }),
  // The next card sliding off the deck.
  flip: play(() => {
    flick({ freq: 1400, to: 3800, q: 0.8, dur: 0.14, gain: 0.045 });
  }),
  // Two rising mallet notes; each answer in a streak lifts them a semitone,
  // and from three in a row a third note sparkles on top.
  right: play((streak = 1) => {
    const lift = Math.min(Math.max(streak - 1, 0), 7);
    mallet({ freq: semitone(784, lift), dur: 0.35, gain: 0.08 });
    mallet({
      freq: semitone(1175, lift),
      dur: 0.5,
      gain: 0.08,
      delay: 0.09,
    });
    if (streak >= 3) {
      mallet({
        freq: semitone(1568, lift),
        dur: 0.45,
        gain: 0.05,
        delay: 0.18,
      });
    }
  }),
  // A soft, low bonk-bonk: clear, but never a harsh buzzer.
  wrong: play(() => {
    tone({ freq: 330, to: 290, dur: 0.16, type: 'triangle', gain: 0.07 });
    tone({
      freq: 247,
      to: 208,
      dur: 0.28,
      type: 'triangle',
      gain: 0.07,
      delay: 0.13,
    });
  }),
  timeout: play(() => {
    [392, 330, 262].forEach((f, i) => {
      tone({
        freq: f,
        dur: 0.16,
        type: 'triangle',
        gain: 0.06,
        delay: i * 0.1,
      });
    });
  }),
  // A woodblock for the last seconds on the timer.
  tick: play(() => {
    mallet({ freq: 1320, dur: 0.06, gain: 0.05 });
  }),
  // The verdict hitting the scorecard.
  stamp: play(() => {
    tone({ freq: 150, to: 70, dur: 0.12, gain: 0.09 });
    flick({ freq: 900, q: 0.7, dur: 0.07, gain: 0.05 });
  }),
  finish: play((ratio) => {
    const notes =
      ratio >= 0.6 ? [523, 659, 784, 1047, 1319] : [523, 466, 415, 349];
    notes.forEach((f, i) => {
      mallet({
        freq: f,
        dur: i === notes.length - 1 ? 0.7 : 0.3,
        gain: 0.07,
        delay: i * 0.085,
      });
    });
  }),
  pop: play(() => {
    tone({ freq: 320, to: 900, dur: 0.12, gain: 0.06 });
  }),
};
