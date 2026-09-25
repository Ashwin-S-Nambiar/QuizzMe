import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  currentStreak,
  normalizeQuestion,
  shareText,
  shuffle,
  splitCategory,
  summarize,
} from './quiz.js';

const raw = {
  type: 'multiple',
  difficulty: 'hard',
  category: 'Entertainment%3A%20Film',
  question: 'Who%20directed%20%22Heat%22%3F',
  correct_answer: 'Michael%20Mann',
  incorrect_answers: ['Ridley%20Scott', 'Tony%20Scott', 'John%20Woo'],
};

test('normalizeQuestion decodes RFC 3986 fields and keeps every answer', () => {
  const q = normalizeQuestion(raw);
  assert.equal(q.question, 'Who directed "Heat"?');
  assert.equal(q.category, 'Entertainment: Film');
  assert.equal(q.correct, 'Michael Mann');
  assert.deepEqual([...q.answers].sort(), [
    'John Woo',
    'Michael Mann',
    'Ridley Scott',
    'Tony Scott',
  ]);
});

test('boolean questions always read True then False', () => {
  const q = normalizeQuestion({
    ...raw,
    type: 'boolean',
    correct_answer: 'False',
    incorrect_answers: ['True'],
  });
  assert.deepEqual(q.answers, ['True', 'False']);
});

test('normalizeQuestion survives a malformed escape', () => {
  const q = normalizeQuestion({ ...raw, question: '100%25 or 100%' });
  assert.equal(q.question, '100%25 or 100%');
});

test('shuffle is a permutation and leaves the input alone', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, () => 0);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
  assert.deepEqual([...out].sort(), input);
});

test('splitCategory separates the group prefix', () => {
  assert.deepEqual(splitCategory('Science: Computers'), {
    group: 'Science',
    label: 'Computers',
  });
  assert.deepEqual(splitCategory('History'), { group: null, label: 'History' });
});

const qs = ['a', 'b', 'c', 'd'].map((correct, i) => ({
  correct,
  difficulty: i < 2 ? 'easy' : 'hard',
}));

test('summarize scores, streaks and splits by difficulty', () => {
  const answers = [
    { choice: 'a', ms: 1000 },
    { choice: 'b', ms: 3000 },
    { choice: 'x', ms: 2000 },
    { choice: null, ms: 2000 },
  ];
  const s = summarize(qs, answers);
  assert.equal(s.score, 2);
  assert.equal(s.bestStreak, 2);
  assert.equal(s.avgMs, 2000);
  assert.deepEqual(s.byDifficulty, {
    easy: { right: 2, total: 2 },
    hard: { right: 0, total: 2 },
  });
});

test('currentStreak counts back from the given question', () => {
  const answers = [{ choice: 'x' }, { choice: 'b' }, { choice: 'c' }];
  assert.equal(currentStreak(qs, answers, 2), 2);
  assert.equal(currentStreak(qs, answers, 0), 0);
});

test('shareText wraps the grid every ten cells', () => {
  const many = Array.from({ length: 12 }, () => ({
    correct: 'a',
    difficulty: 'easy',
  }));
  const answers = many.map((_, i) => ({ choice: i % 2 ? 'a' : 'x' }));
  const lines = shareText({
    questions: many,
    answers,
    topic: 'Any',
    url: 'u',
  }).split('\n');
  assert.equal(lines[0], 'QuizzMe! 6/12 · Any');
  assert.equal([...lines[1]].length, 10);
  assert.equal([...lines[2]].length, 2);
  assert.equal(lines[3], 'u');
});
