import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { describe, FALLBACK } from '../lib/categories.js';
import {
  fetchCategories,
  fetchCategoryCounts,
  fetchGlobalCounts,
} from '../lib/opentdb.js';

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const m = matchMedia(query);
      m.addEventListener('change', cb);
      return () => m.removeEventListener('change', cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

function applyTheme(theme) {
  const root = document.documentElement;
  const swap = () => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === 'dark' ? '#0a0a0b' : '#fafaf9';
  };
  if (
    document.startViewTransition &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.startViewTransition(swap);
  } else {
    swap();
  }
}

export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? 'light',
  );

  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (localStorage.getItem('qz:theme')) return;
      const next = m.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    const system = matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    try {
      if (next === system) localStorage.removeItem('qz:theme');
      else localStorage.setItem('qz:theme', next);
    } catch {}
    applyTheme(next);
    setTheme(next);
  }, [theme]);

  return [theme, toggle];
}

export function useTrivia() {
  const [categories, setCategories] = useState(() => FALLBACK.map(describe));
  const [counts, setCounts] = useState(null);
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCategories(ctrl.signal)
      .then((list) => list.length && setCategories(list.map(describe)))
      .catch(() => {});

    const check = () => {
      if (document.hidden) return;
      fetchGlobalCounts(ctrl.signal)
        .then((c) => {
          setCounts(c);
          setStatus('online');
        })
        .catch((e) => e.name !== 'AbortError' && setStatus('offline'));
    };
    check();
    const id = setInterval(check, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      ctrl.abort();
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  return { categories, counts, status };
}

export function useCategoryCounts(category) {
  const [state, setState] = useState({ category: null, counts: null });

  useEffect(() => {
    if (!category) return;
    const ctrl = new AbortController();
    fetchCategoryCounts(category, ctrl.signal)
      .then((counts) => setState({ category, counts }))
      .catch(() => {});
    return () => ctrl.abort();
  }, [category]);

  return category ? state.counts : null;
}

export function useScrolled(threshold = 4) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > threshold);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
