import {
  ArrowClockwise,
  CaretDown,
  Check,
  Export,
  Minus,
  Target,
  X,
} from '@phosphor-icons/react';
import {
  AnimatePresence,
  animate,
  motion,
  useReducedMotion,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTitle } from '../hooks/index.js';
import {
  formatSeconds,
  shareText,
  splitCategory,
  summarize,
  verdict,
} from '../lib/quiz.js';
import { sfx } from '../lib/sound.js';
import { haptic, toast } from '../lib/store.js';
import BottomBar from './BottomBar.jsx';
import { DIFFICULTY_STYLE } from './Play.jsx';
import Segmented from './Segmented.jsx';

function ScoreRing({ score, total }) {
  const reduce = useReducedMotion();
  const number = useRef(null);
  const ratio = total ? score / total : 0;

  useEffect(() => {
    if (reduce) {
      number.current.textContent = String(score);
      return;
    }
    const controls = animate(0, score, {
      duration: 0.9,
      delay: 0.15,
      ease: [0.23, 1, 0.32, 1],
      onUpdate: (v) => {
        if (number.current) number.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [score, reduce]);

  const tone =
    ratio >= 0.8
      ? 'var(--color-good)'
      : ratio >= 0.5
        ? 'var(--color-accent)'
        : 'var(--color-bad)';

  return (
    <div className="relative mx-auto size-48 sm:size-52">
      <svg
        viewBox="0 0 100 100"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth="7"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? ratio : 0 }}
          animate={{ pathLength: ratio }}
          transition={{ duration: 1, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          style={{ opacity: ratio === 0 ? 0 : 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-display text-6xl leading-none font-semibold tracking-tight tabular-nums">
          <span ref={number}>0</span>
          <span className="text-3xl text-muted">/{total}</span>
        </p>
        <p className="mt-2 font-mono text-xs text-muted tabular-nums">
          {Math.round(ratio * 100)}%
        </p>
      </div>
    </div>
  );
}

function ReviewRow({ q, a, n }) {
  const [open, setOpen] = useState(false);
  const right = a.choice === q.correct;
  const Icon = right ? Check : a.choice == null ? Minus : X;
  return (
    <div className="overflow-hidden rounded-2xl bg-raised shadow-[inset_0_0_0_1px_var(--color-line)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3.5 text-left hover-fine:bg-surface/60"
      >
        <span
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
            right ? 'bg-good-tint text-good-ink' : 'bg-bad-tint text-bad-ink'
          }`}
        >
          <Icon size={13} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-[0.7rem] text-muted tabular-nums">
            Q{n} · {splitCategory(q.category).label} · {formatSeconds(a.ms)}
          </span>
          <span
            className={`mt-0.5 block text-[0.95rem] leading-snug ${open ? '' : 'line-clamp-2'}`}
          >
            {q.question}
          </span>
        </span>
        <CaretDown
          weight="bold"
          size={18}
          className={`mt-1 shrink-0 text-muted transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="space-y-1.5 px-3.5 pb-3.5 pl-12.5 text-sm">
              {!right && (
                <p className="flex gap-2 rounded-xl bg-bad-tint px-3 py-2 text-bad-ink">
                  <span className="shrink-0 font-medium">You:</span>
                  <span>
                    {a.choice ?? (a.timedOut ? 'Ran out of time' : 'Skipped')}
                  </span>
                </p>
              )}
              <p className="flex gap-2 rounded-xl bg-good-tint px-3 py-2 text-good-ink">
                <span className="shrink-0 font-medium">Answer:</span>
                <span>{q.correct}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Results({
  questions,
  answers,
  topic,
  shareUrl,
  onPlayAgain,
  onPractice,
  onNew,
}) {
  const s = summarize(questions, answers);
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState('all');
  useTitle(`${s.score}/${s.total} on ${topic} · QuizzMe!`);

  useEffect(() => {
    const id = setTimeout(() => sfx.finish(s.ratio), 450);
    return () => clearTimeout(id);
  }, [s.ratio]);

  const misses = questions.filter(
    (q, i) => answers[i].choice !== q.correct,
  ).length;

  useEffect(() => {
    if (s.ratio < 0.8 || reduce) return;
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent')
      .trim();
    const colors = ['#94d7a2', '#ffed76', '#c0b2f8', '#f86e6e', accent];
    const id = setTimeout(async () => {
      const { default: confetti } = await import('canvas-confetti');
      haptic([10, 40, 10]);
      const base = {
        colors,
        disableForReducedMotion: true,
        ticks: 220,
        scalar: 0.9,
      };
      if (s.ratio === 1) {
        confetti({
          ...base,
          particleCount: 70,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.75 },
        });
        confetti({
          ...base,
          particleCount: 70,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.75 },
        });
      } else {
        confetti({
          ...base,
          particleCount: 50,
          spread: 70,
          origin: { y: 0.35 },
        });
      }
    }, 700);
    return () => clearTimeout(id);
  }, [s.ratio, reduce]);

  const share = async () => {
    const text = shareText({ questions, answers, topic, url: shareUrl });
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Result copied. Paste it anywhere.');
    } catch {
      toast("Couldn't copy that. Your browser blocked it.");
    }
  };

  const rows = questions
    .map((q, i) => ({ q, a: answers[i], n: i + 1 }))
    .filter(({ q, a }) => filter === 'all' || a.choice !== q.correct);

  const difficulties = Object.entries(s.byDifficulty);

  return (
    <div className="mx-auto grid max-w-6xl gap-x-10 gap-y-8 px-(--gutter) pt-4 pb-36 lg:grid-cols-[23rem_minmax(0,1fr)] lg:pt-10 lg:pb-20">
      <section className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-6 text-center">
          <p className="eyebrow">{topic}</p>
          <div className="mt-4">
            <ScoreRing score={s.score} total={s.total} />
          </div>
          <motion.h1
            initial={{ opacity: 0, transform: 'translateY(6px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ delay: 0.5, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4 font-display text-2xl font-semibold tracking-tight"
          >
            {verdict(s.ratio)}
          </motion.h1>

          <dl className="mt-6 grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface py-3">
            {[
              ['Best streak', s.bestStreak],
              ['Avg time', formatSeconds(s.avgMs)],
              ['Missed', misses],
            ].map(([k, v]) => (
              <div key={k} className="px-2">
                <dt className="text-[0.7rem] text-muted">{k}</dt>
                <dd className="mt-0.5 font-mono text-lg font-medium tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          {difficulties.length > 1 && (
            <div className="mt-5 space-y-2 text-left">
              {difficulties.map(([d, v]) => (
                <div key={d} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-16 rounded-full px-2 py-0.5 text-center text-xs capitalize ${DIFFICULTY_STYLE[d]}`}
                  >
                    {d}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <motion.span
                      className="block h-full origin-left rounded-full bg-ink-2"
                      initial={{ transform: 'scaleX(0)' }}
                      animate={{ transform: `scaleX(${v.right / v.total})` }}
                      transition={{
                        delay: 0.4,
                        duration: 0.6,
                        ease: [0.23, 1, 0.32, 1],
                      }}
                    />
                  </span>
                  <span className="w-10 text-right font-mono text-xs text-muted tabular-nums">
                    {v.right}/{v.total}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 hidden gap-2 lg:grid">
            <button
              type="button"
              onClick={onPlayAgain}
              className="btn btn-primary press"
            >
              <ArrowClockwise weight="bold" size={17} />
              New round, same settings
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onNew} className="btn press glass">
                Change topic
              </button>
              <button type="button" onClick={share} className="btn press glass">
                <Export weight="bold" size={17} />
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="review-title" className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="review-title"
            className="font-display text-2xl font-semibold tracking-tight"
          >
            Your answers
          </h2>
          {misses > 0 && (
            <div className="w-52">
              <Segmented
                label="Show"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'missed', label: `Missed ${misses}` },
                ]}
              />
            </div>
          )}
        </div>

        {misses > 0 && (
          <button
            type="button"
            onClick={onPractice}
            className="press mt-5 flex w-full items-center gap-3 rounded-2xl bg-tint p-3.5 text-left text-tint-ink"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-on-accent">
              <Target weight="duotone" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">
                Practice the {misses === 1 ? 'one' : misses} you missed
              </span>
              <span className="block text-sm opacity-75">
                Same questions, shuffled, no waiting on the API.
              </span>
            </span>
          </button>
        )}

        <ol className="mt-5 space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map(({ q, a, n }, i) => (
              <motion.li
                key={q.id}
                layout={!reduce}
                initial={{ opacity: 0, transform: 'translateY(8px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{
                  duration: 0.28,
                  delay: Math.min(i, 12) * 0.035,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                <ReviewRow q={q} a={a} n={n} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      </section>

      <BottomBar>
        <button type="button" onClick={onNew} className="btn press glass px-4">
          Topics
        </button>
        <button
          type="button"
          onClick={onPlayAgain}
          className="btn btn-primary press flex-1"
        >
          <ArrowClockwise weight="bold" size={17} />
          Play again
        </button>
        <button
          type="button"
          onClick={share}
          className="icon-btn press glass size-12!"
          aria-label="Share result"
        >
          <Export weight="bold" size={18} />
        </button>
      </BottomBar>
    </div>
  );
}
