import { useSyncExternalStore } from 'react';

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(next) {
      state = typeof next === 'function' ? next(state) : next;
      for (const l of listeners) l();
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

export function createPersistedStore(key, initial) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(key));
  } catch {}
  const store = createStore(
    saved && typeof initial === 'object' && !Array.isArray(initial)
      ? { ...initial, ...saved }
      : (saved ?? initial),
  );
  store.subscribe(() => {
    try {
      localStorage.setItem(key, JSON.stringify(store.get()));
    } catch {}
  });
  return store;
}

export const useStore = (store) =>
  useSyncExternalStore(store.subscribe, store.get, store.get);

export const prefsStore = createPersistedStore('qz:prefs', {
  category: '',
  difficulty: '',
  type: '',
  amount: 10,
  mode: 'instant',
  timer: 0,
});

export const setPref = (key, value) =>
  prefsStore.set((p) => ({ ...p, [key]: value }));

export const historyStore = createPersistedStore('qz:history', []);

export function recordRun(run) {
  historyStore.set((list) => [run, ...list].slice(0, 100));
}

export const toastStore = createStore([]);
let nextToast = 1;

export function toast(message, { action, duration = 4000 } = {}) {
  const id = nextToast++;
  toastStore.set((list) =>
    [...list, { id, message, action, duration }].slice(-3),
  );
  return id;
}

export const dismissToast = (id) =>
  toastStore.set((list) => list.filter((t) => t.id !== id));

export function haptic(pattern = 8) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  navigator.vibrate?.(pattern);
}

// Named haptic patterns, tuned to the sounds: short taps for presses, a
// double pulse for a deal, a lift for a right answer and a heavier
// thud-thud for a wrong one.
export const buzz = {
  tap: () => haptic(6),
  select: () => haptic(8),
  deal: () => haptic([6, 40, 10]),
  flip: () => haptic(5),
  right: () => haptic([10, 40, 18]),
  streak: () => haptic([8, 30, 8, 30, 22]),
  wrong: () => haptic([26, 60, 26]),
  stamp: (good) => haptic(good ? [14, 50, 14, 50, 30] : 22),
};
