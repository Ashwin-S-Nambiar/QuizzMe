const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function shuffle(list, random = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

let seq = 0;

export function normalizeQuestion(raw, index = 0, _all, random = Math.random) {
  const correct = decode(raw.correct_answer);
  const wrong = raw.incorrect_answers.map(decode);
  const type = decode(raw.type);
  return {
    id: `q${++seq}-${index}`,
    type,
    difficulty: decode(raw.difficulty),
    category: decode(raw.category),
    question: decode(raw.question),
    correct,
    answers:
      type === 'boolean'
        ? ['True', 'False']
        : shuffle([correct, ...wrong], random),
  };
}

export function splitCategory(name) {
  const i = name.indexOf(': ');
  if (i === -1) return { group: null, label: name };
  return { group: name.slice(0, i), label: name.slice(i + 2) };
}

export function summarize(questions, answers) {
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let time = 0;
  const byDifficulty = {};
  questions.forEach((q, i) => {
    const a = answers[i];
    const right = a?.choice === q.correct;
    byDifficulty[q.difficulty] ??= { right: 0, total: 0 };
    const d = byDifficulty[q.difficulty];
    d.total++;
    if (right) {
      score++;
      d.right++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
    time += a?.ms ?? 0;
  });
  const total = questions.length;
  return {
    score,
    total,
    ratio: total ? score / total : 0,
    bestStreak,
    avgMs: total ? Math.round(time / total) : 0,
    byDifficulty,
  };
}

export function currentStreak(questions, answers, upto) {
  let n = 0;
  for (let i = upto; i >= 0; i--) {
    if (answers[i]?.choice !== questions[i].correct) break;
    n++;
  }
  return n;
}

export function verdict(ratio) {
  if (ratio === 1) return 'Clean sweep.';
  if (ratio >= 0.8) return 'That was sharp.';
  if (ratio >= 0.6) return 'Solid run.';
  if (ratio >= 0.4) return 'Could go either way.';
  if (ratio > 0) return 'Tough set. Go again?';
  return 'Nothing landed. Happens.';
}

export function shareText({ questions, answers, topic, url }) {
  const { score, total } = summarize(questions, answers);
  const cells = questions.map((q, i) =>
    answers[i]?.choice === q.correct ? '🟩' : '🟥',
  );
  const rows = [];
  for (let i = 0; i < cells.length; i += 10)
    rows.push(cells.slice(i, i + 10).join(''));
  return [`QuizzMe! ${score}/${total} · ${topic}`, ...rows, url].join('\n');
}

export function formatSeconds(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}
