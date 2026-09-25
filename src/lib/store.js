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
