import { createPersistedStore } from './store.js';

export const soundStore = createPersistedStore('qz:sound', true);

let ctx = null;

function audio() {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) {
    return null;
  }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
    ctx = new AC();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
    return null;
  }
  return ctx;
}

function tone({ freq, to, dur, type = 'sine', gain = 0.06, delay = 0 }) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(gain, t + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.03);
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
  tap: play(() => tone({ freq: 1100, to: 700, dur: 0.045, gain: 0.035 })),
  pick: play(() => {
    tone({ freq: 520, to: 780, dur: 0.08, type: 'triangle', gain: 0.05 });
  }),
  right: play((streak = 1) => {
    const lift = Math.min(Math.max(streak - 1, 0), 7);
    tone({
      freq: semitone(660, lift),
      dur: 0.12,
      type: 'triangle',
      gain: 0.07,
    });
    tone({
      freq: semitone(990, lift),
      dur: 0.24,
      type: 'triangle',
      gain: 0.07,
      delay: 0.085,
    });
  }),
  wrong: play(() => {
    tone({ freq: 240, to: 170, dur: 0.2, type: 'square', gain: 0.022 });
    tone({
      freq: 200,
      to: 130,
      dur: 0.26,
      type: 'square',
      gain: 0.02,
      delay: 0.11,
    });
  }),
  tick: play(() => tone({ freq: 1500, dur: 0.03, gain: 0.025 })),
  finish: play((ratio) => {
    const notes = ratio >= 0.6 ? [523, 659, 784, 1047] : [523, 494, 440];
    notes.forEach((f, i) => {
      tone({
        freq: f,
        dur: 0.22,
        type: 'triangle',
        gain: 0.06,
        delay: i * 0.09,
      });
    });
  }),
  pop: play(() =>
    tone({ freq: 320, to: 900, dur: 0.12, type: 'sine', gain: 0.06 }),
  ),
};
