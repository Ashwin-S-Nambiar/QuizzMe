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
import { categoryLabel, categoryTone, flat } from '../lib/categories.js';
import { formatSeconds, shareText, summarize, verdict } from '../lib/quiz.js';
import { sfx } from '../lib/sound.js';
import { haptic, toast } from '../lib/store.js';
import { DealNote, DeckGlyph } from './Deal.jsx';
import { Pips } from './Pips.jsx';
import Segmented from './Segmented.jsx';

const EASE = [0.23, 1, 0.32, 1];

function Score({ score, total }) {
  const reduce = useReducedMotion();
  const number = useRef(null);

  useEffect(() => {
    if (reduce) {
      number.current.textContent = String(score);
      return;
    }
    const controls = animate(0, score, {
      duration: 0.9,
      delay: 0.15,
      ease: EASE,
      onUpdate: (v) => {
        if (number.current) number.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [score, reduce]);

  return (
    <p className="printed flex items-baseline justify-center text-[clamp(6rem,24vw,8.5rem)] leading-[0.85]">
      <span ref={number} className="tabular-nums">
        0
      </span>
      <span className="text-[0.4em] text-muted">/{total}</span>
    </p>
  );
}

// The verdict is stamped onto the scorecard once the count settles.
function Stamp({ ratio }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (ratio < 0.8) return;
    const id = setTimeout(() => haptic([10, 40, 10]), 1000);
    return () => clearTimeout(id);
  }, [ratio]);
  const tone =
    ratio >= 0.8 ? 'text-good-ink' : ratio >= 0.5 ? 'text-ink' : 'text-bad-ink';
  return (
    <motion.p
      initial={{
        opacity: 0,
        transform: reduce
          ? 'rotate(-5deg) scale(1)'
          : 'rotate(-14deg) scale(1.7)',
      }}
      animate={{ opacity: 1, transform: 'rotate(-5deg) scale(1)' }}
      transition={{
        delay: 0.95,
        type: 'spring',
        duration: 0.45,
        bounce: 0.3,
      }}
      className={`printed mx-auto mt-5 w-fit rounded-md border-[2.5px] border-current px-3 pt-1.5 pb-1 text-[1.35rem] uppercase ${tone}`}
    >
      {verdict(ratio)}
    </motion.p>
  );
}

// One small card per question, dealt out in order.
function Strip({ questions, answers }) {
  return (
    <ol
      className="flex flex-wrap justify-center gap-1"
      aria-label="Right and wrong, in order"
    >
      {questions.map((q, i) => {
        const right = answers[i].choice === q.correct;
        return (
          <motion.li
            key={q.id}
            initial={{ opacity: 0, transform: 'translateY(-6px)' }}
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{
              delay: 0.25 + Math.min(i, 30) * 0.025,
              duration: 0.25,
              ease: EASE,
            }}
            className={`h-4.5 w-3.5 rounded-[3px] ${right ? 'bg-good' : 'bg-bad'}`}
            aria-label={`${i + 1}: ${right ? 'right' : 'wrong'}`}
          />
        );
      })}
    </ol>
  );
}

function ReviewRow({ q, a, n }) {
  const [open, setOpen] = useState(false);
  const right = a.choice === q.correct;
  const Icon = right ? Check : a.choice == null ? Minus : X;
  return (
    <div className="card relative overflow-hidden rounded-xl">
      <span
        className={`absolute inset-y-0 left-0 w-1 ${right ? 'bg-good' : 'bg-bad'}`}
        aria-hidden="true"
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3.5 pl-4.5 text-left transition-colors duration-150 hover-fine:bg-card-2"
      >
        <span
          className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md ${
            right ? 'bg-good-tint text-good-ink' : 'bg-bad-tint text-bad-ink'
          }`}
        >
          <Icon size={13} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.04em] text-muted uppercase semi-cond">
            <span
              className="size-2 rounded-xs"
              style={{ background: flat(categoryTone(q.category)) }}
            />
            No. {String(n).padStart(2, '0')} · {categoryLabel(q.category)} ·{' '}
            {formatSeconds(a.ms)}
          </span>
          <span
            className={`mt-1 block text-[0.95rem] leading-snug font-medium ${open ? '' : 'line-clamp-2'}`}
          >
            {q.question}
          </span>
        </span>
        <CaretDown
          weight="bold"
          size={16}
          className={`mt-1 shrink-0 text-muted transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE }}
          >
            <div className="space-y-1.5 px-3.5 pb-3.5 pl-13 text-sm">
              {!right && (
                <p className="flex gap-2 rounded-lg bg-bad-tint px-3 py-2 text-bad-ink">
                  <span className="shrink-0 font-semibold">You:</span>
                  <span className="line-through decoration-2">
                    {a.choice ?? (a.timedOut ? 'Ran out of time' : 'Skipped')}
                  </span>
                </p>
              )}
              <p className="flex gap-2 rounded-lg bg-good-tint px-3 py-2 text-good-ink">
                <span className="shrink-0 font-semibold">Answer:</span>
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
  tone,
  shareUrl,
  deal,
  onPlayAgain,
  onCancel,
  onDismiss,
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

  const playAgain = () => {
    if (!deal.busy) onPlayAgain();
  };

  const rows = questions
    .map((q, i) => ({ q, a: answers[i], n: i + 1 }))
    .filter(({ q, a }) => filter === 'all' || a.choice !== q.correct);

  const difficulties = Object.entries(s.byDifficulty);

  const again = (
    <button
      type="button"
      onClick={playAgain}
      aria-busy={deal.busy}
      className="btn btn-ink press flex-1"
    >
      {deal.busy ? (
        <DeckGlyph busy />
      ) : (
        <ArrowClockwise weight="bold" size={17} />
      )}
      <span className="slot text-left">
        <span className={deal.busy ? 'invisible' : ''}>Deal again</span>
        <span className={deal.busy ? '' : 'invisible'}>Dealing…</span>
      </span>
    </button>
  );

  return (
    <div className="flex min-h-[calc(100dvh-4rem-var(--safe-t))] flex-col">
      <div className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-x-10 gap-y-8 px-(--gutter) pt-3 pb-10 lg:grid-cols-[24rem_minmax(0,1fr)] lg:pt-8 lg:pb-20">
        <section className="lg:sticky lg:top-20 lg:self-start">
          <div className="card overflow-hidden">
            <div
              className={`flex h-12 items-center justify-between gap-3 px-5 ${
                tone
                  ? 'text-on-flat'
                  : 'card-back rounded-none text-card shadow-none'
              }`}
              style={tone ? { background: flat(tone) } : undefined}
            >
              <span className="printed truncate text-[1.3rem] uppercase">
                {topic}
              </span>
              <span className="text-[0.7rem] font-semibold tracking-[0.08em] uppercase opacity-75 semi-cond">
                Scorecard
              </span>
            </div>
            <div className="px-5 pt-7 pb-5 text-center">
              <h1 className="sr-only">
                {s.score} of {s.total}. {verdict(s.ratio)}
              </h1>
              <Score score={s.score} total={s.total} />
              <Stamp ratio={s.ratio} />
              <div className="mt-6">
                <Strip questions={questions} answers={answers} />
              </div>

              <dl className="mt-6 grid grid-cols-3 border-y border-dashed border-line-2 py-3">
                {[
                  ['Best streak', s.bestStreak],
                  ['Avg time', formatSeconds(s.avgMs)],
                  ['Missed', misses],
                ].map(([k, v], i) => (
                  <div
                    key={k}
                    className={`px-2 ${i ? 'border-l border-dashed border-line-2' : ''}`}
                  >
                    <dt className="caps text-[0.66rem]">{k}</dt>
                    <dd className="printed mt-1 text-[1.7rem]">{v}</dd>
                  </div>
                ))}
              </dl>

              {difficulties.length > 1 && (
                <div className="mt-5 space-y-2.5 text-left">
                  {difficulties.map(([d, v]) => (
                    <div key={d} className="flex items-center gap-3 text-sm">
                      <span className="flex w-20 items-center gap-2 text-xs font-semibold capitalize">
                        <Pips level={d} className="text-ink-2" />
                        {d}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-xs bg-line">
                        <motion.span
                          className="block h-full origin-left bg-ink-2"
                          initial={{ transform: 'scaleX(0)' }}
                          animate={{
                            transform: `scaleX(${v.right / v.total})`,
                          }}
                          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
                        />
                      </span>
                      <span className="printed w-10 text-right text-base text-muted">
                        {v.right}/{v.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 hidden text-left lg:block">
                <div className="flex gap-2">{again}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onNew}
                    className="btn btn-plain press"
                  >
                    Change topic
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    className="btn btn-plain press"
                  >
                    <Export weight="bold" size={17} />
                    Share
                  </button>
                </div>
                <DealNote
                  deal={deal}
                  onCancel={onCancel}
                  onDismiss={onDismiss}
                />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="review-title" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="review-title" className="printed text-[2.2rem] uppercase">
              Your cards
            </h2>
            {misses > 0 && (
              <div className="w-56">
                <Segmented
                  label="Show"
                  hideLabel
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
              className="group press mt-5 flex w-full items-center gap-3 rounded-xl bg-yellow p-3 text-left text-on-flat shadow-(--shadow-card) hover-fine:-translate-y-0.5"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-on-flat text-yellow">
                <Target weight="bold" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  Practice the {misses === 1 ? 'one' : misses} you missed
                </span>
                <span className="block text-sm opacity-75">
                  Same cards, reshuffled, no waiting on the API.
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
                    ease: EASE,
                  }}
                >
                  <ReviewRow q={q} a={a} n={n} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </section>
      </div>

      <div className="bottom-bar sticky bottom-0 z-20 border-t border-line bg-bg px-(--gutter) pt-3 lg:hidden">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNew}
              className="btn btn-plain press px-4"
            >
              Topics
            </button>
            {again}
            <button
              type="button"
              onClick={share}
              className="btn btn-plain press size-12 shrink-0 px-0"
              aria-label="Share result"
              data-tip="Share result"
            >
              <Export weight="bold" size={18} />
            </button>
          </div>
          <DealNote
            deal={deal}
            onCancel={onCancel}
            onDismiss={onDismiss}
            className="-mb-1"
          />
        </div>
      </div>
    </div>
  );
}
