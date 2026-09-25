import { normalizeQuestion } from './quiz.js';

const BASE = 'https://opentdb.com';
const GAP = 5200;
const TOKEN_KEY = 'qz:token';
const LAST_KEY = 'qz:last';
const CATS_KEY = 'qz:categories';
const TOKEN_TTL = 5.5 * 60 * 60 * 1000;
const CATS_TTL = 7 * 24 * 60 * 60 * 1000;

export class TriviaError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind;
  }
}

const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

let chain = Promise.resolve();

function throttle(signal, onWait) {
  const run = chain.then(async () => {
    const wait = (read(LAST_KEY) ?? 0) + GAP - Date.now();
    if (wait > 0) {
      onWait?.(Date.now() + wait);
      await sleep(wait, signal);
    }
    write(LAST_KEY, Date.now());
  });
  chain = run.catch(() => {});
  return run;
}

async function getJSON(path, signal) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new TriviaError('network', "Couldn't reach Open Trivia DB.");
  }
  if (res.status === 429) return { response_code: 5 };
  if (!res.ok)
    throw new TriviaError('network', `Open Trivia DB said ${res.status}.`);
  return res.json();
}

async function getToken(signal) {
  const saved = read(TOKEN_KEY);
  if (saved && Date.now() - saved.at < TOKEN_TTL) return saved.token;
  try {
    const data = await getJSON('/api_token.php?command=request', signal);
    if (data.response_code === 0) {
      write(TOKEN_KEY, { token: data.token, at: Date.now() });
      return data.token;
    }
  } catch (error) {
    if (error.name === 'AbortError') throw error;
  }
  return null;
}

export async function resetToken() {
  const saved = read(TOKEN_KEY);
  if (!saved) return;
  try {
    await getJSON(`/api_token.php?command=reset&token=${saved.token}`);
    write(TOKEN_KEY, { token: saved.token, at: Date.now() });
  } catch {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function fetchQuestions(options, { signal, onWait } = {}) {
  const { category, difficulty, type, amount } = options;
  for (let attempt = 0; attempt < 4; attempt++) {
    const token = await getToken(signal);
    const params = new URLSearchParams({
      amount: String(amount),
      encode: 'url3986',
    });
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    if (type) params.set('type', type);
    if (token) params.set('token', token);

    await throttle(signal, onWait);
    const data = await getJSON(`/api.php?${params}`, signal);

    switch (data.response_code) {
      case 0:
        if (token) write(TOKEN_KEY, { token, at: Date.now() });
        return data.results.map(normalizeQuestion);
      case 1:
        throw new TriviaError('empty', 'Not enough questions for that mix.');
      case 2:
        throw new TriviaError(
          'invalid',
          "Open Trivia DB didn't like those options.",
        );
      case 3:
        localStorage.removeItem(TOKEN_KEY);
        break;
      case 4:
        throw new TriviaError(
          'exhausted',
          "You've seen every question in this mix.",
        );
      case 5:
        break;
      default:
        throw new TriviaError(
          'network',
          'Open Trivia DB sent something unexpected.',
        );
    }
  }
  throw new TriviaError('rate', 'Open Trivia DB is busy right now.');
}

export async function fetchCategories(signal) {
  const saved = read(CATS_KEY);
  if (saved && Date.now() - saved.at < CATS_TTL) return saved.list;
  const data = await getJSON('/api_category.php', signal);
  const list = data.trivia_categories ?? [];
  if (list.length) write(CATS_KEY, { list, at: Date.now() });
  return list;
}

export async function fetchGlobalCounts(signal) {
  const data = await getJSON('/api_count_global.php', signal);
  const byCategory = {};
  for (const [id, c] of Object.entries(data.categories ?? {})) {
    byCategory[id] = c.total_num_of_verified_questions;
  }
  return {
    total: data.overall?.total_num_of_verified_questions ?? 0,
    byCategory,
  };
}

const countCache = new Map();

export async function fetchCategoryCounts(category, signal) {
  if (countCache.has(category)) return countCache.get(category);
  const data = await getJSON(`/api_count.php?category=${category}`, signal);
  const c = data.category_question_count;
  const counts = {
    '': c.total_question_count,
    easy: c.total_easy_question_count,
    medium: c.total_medium_question_count,
    hard: c.total_hard_question_count,
  };
  countCache.set(category, counts);
  return counts;
}
