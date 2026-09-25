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

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';

// Theme changes animate with a view transition: a circle grows out of the
// toggle for a manual switch, and the page cross-fades when the OS flips it.
function applyTheme(theme, origin) {
  const root = document.documentElement;
  const swap = () => {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === 'dark' ? '#0a0a0b' : '#fafaf9';
  };
  if (
    !document.startViewTransition ||
    document.hidden ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    swap();
    return;
  }
  const transition = document.startViewTransition(swap);
  transition.ready
    .then(() => {
      if (!origin) {
        root.animate(
          { opacity: [0, 1] },
          {
            duration: 420,
            easing: 'ease-out',
            pseudoElement: '::view-transition-new(root)',
          },
        );
        return;
      }
      const { x, y } = origin;
      const r = Math.hypot(
        Math.max(x, innerWidth - x),
        Math.max(y, innerHeight - y),
      );
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${r}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 560,
          easing: EASE,
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {});
}

export function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? 'light',
  );

  // Follow the system until the person picks a theme themselves.
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      try {
        if (localStorage.getItem('qz:theme')) return;
      } catch {}
      const next = m.matches ? 'dark' : 'light';
      applyTheme(next);
      setTheme(next);
    };
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(
    (e) => {
      const next = theme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('qz:theme', next);
      } catch {}
      const rect = e?.currentTarget?.getBoundingClientRect();
      applyTheme(
        next,
        rect && {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      );
      setTheme(next);
    },
    [theme],
  );

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
