import {
  ArrowClockwiseIcon,
  CaretDownIcon,
  CheckIcon,
  ExportIcon,
  MinusIcon,
  TargetIcon,
  XIcon,
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
import { buzz, toast } from '../lib/store.js';
import { DealNote, DeckGlyph } from './Deal.jsx';
import { Pips } from './Pips.jsx';
import Segmented from './Segmented.jsx';
import SiteFooter from './SiteFooter.jsx';

const EASE = [0.23, 1, 0.32, 1];
const STAMP_AT = 0.95;

function Score({ score, total }) {
  const reduce = useReducedMotion();
  const number = useRef(null);

  useEffect(() => {
    if (reduce) {
      number.current.textContent = String(score);
      return;
    }
    const controls = animate(0, score, {
      duration: 0.8,
      delay: 0.15,
      ease: EASE,
      onUpdate: (v) => {
        if (number.current) number.current.textContent = String(Math.round(v));
      },
    });
    return () => controls.stop();
  }, [score, reduce]);

  return (
    <p className="display flex items-baseline justify-center text-[clamp(4.5rem,18vw,5.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em]">
      <span ref={number} className="tabular-nums">
        {reduce ? score : 0}
      </span>
      <span className="ml-1 text-[0.42em] tracking-normal text-faint">
        /{total}
      </span>
    </p>
  );
}

// The verdict is stamped onto the scorecard once the count settles, with a
// thump and a buzz.
function Stamp({ ratio }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const id = setTimeout(
      () => {
        sfx.stamp();
        buzz.stamp(ratio >= 0.8);
      },
      reduce ? 300 : STAMP_AT * 1000 + 60,
    );
    return () => clearTimeout(id);
  }, [ratio, reduce]);

  const tone =
    ratio >= 0.8
      ? 'bg-good-tint text-good-ink border-good-line'
      : ratio >= 0.5
        ? 'bg-lilac-soft text-brand-ink border-lilac'
        : 'bg-bad-tint text-bad-ink border-bad-line';
  return (
    <motion.p
      initial={{
        opacity: 0,
        transform: reduce
          ? 'rotate(-2deg) scale(1)'
          : 'rotate(-8deg) scale(1.5)',
      }}
      animate={{ opacity: 1, transform: 'rotate(-2deg) scale(1)' }}
      transition={{
        delay: reduce ? 0.2 : STAMP_AT,
        type: 'spring',
        duration: 0.4,
        bounce: 0.35,
      }}
      className={`display mx-auto mt-4 w-fit rounded-full border-2 px-4 py-1.5 text-[1.05rem] font-bold ${tone}`}
    >
      {verdict(ratio)}
    </motion.p>
  );
}

// One small tile per card, dealt out in order.
function Strip({ questions, answers }) {
  return (
    <ol
      className="flex flex-wrap justify-center gap-1.5"
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
            className={`h-5 w-4 rounded-[5px] ${
              right
                ? 'bg-good shadow-[0_2px_0_var(--color-good-edge)]'
                : 'bg-bad shadow-[0_2px_0_var(--color-bad-edge)]'
            }`}
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
  const Icon = right ? CheckIcon : a.choice == null ? MinusIcon : XIcon;
  return (
    <div className="tact overflow-hidden [--edge:3px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3.5 text-left transition-colors duration-150 hover-fine:bg-card-2"
      >
        <span
          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${
            right ? 'bg-good text-white' : 'bg-bad text-white'
          } dark:text-bg`}
        >
          <Icon size={14} weight="bold" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] font-medium text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full"
                style={{ background: flat(categoryTone(q.category)) }}
              />
              {categoryLabel(q.category)}
            </span>
            <span aria-hidden="true">·</span>
            <span>Card {n}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatSeconds(a.ms)}</span>
          </span>
          <span
            className={`mt-1 block text-[0.98rem] leading-snug font-medium wrap-break-word ${open ? '' : 'line-clamp-2'}`}
          >
            {q.question}
          </span>
        </span>
        <CaretDownIcon
          weight="bold"
          size={16}
          className={`mt-1.5 shrink-0 text-muted transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
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
            <div className="space-y-1.5 px-3.5 pb-3.5 pl-13.5 text-sm">
              {!right && (
                <p className="flex gap-2 rounded-xl bg-bad-tint px-3 py-2 text-bad-ink">
                  <span className="shrink-0 font-semibold">You</span>
                  <span className="min-w-0 wrap-break-word line-through decoration-2">
                    {a.choice ?? (a.timedOut ? 'Ran out of time' : 'Skipped')}
                  </span>
                </p>
              )}
              <p className="flex gap-2 rounded-xl bg-good-tint px-3 py-2 text-good-ink">
                <span className="shrink-0 font-semibold">Answer</span>
                <span className="min-w-0 wrap-break-word">{q.correct}</span>
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
    const id = setTimeout(() => sfx.finish(s.ratio), 300);
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
    if (deal.busy) return;
    buzz.deal();
    onPlayAgain();
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
      data-sfx="deal"
      className="btn btn-brand press min-w-0 flex-1"
    >
      {deal.busy ? (
        <DeckGlyph busy />
      ) : (
        <ArrowClockwiseIcon weight="bold" size={18} />
      )}
      <span className="slot text-left">
        <span className={deal.busy ? 'invisible' : ''}>Deal again</span>
        <span className={deal.busy ? '' : 'invisible'}>Dealing…</span>
      </span>
    </button>
  );

  return (
    <div className="flex min-h-[calc(100dvh-4rem-var(--safe-t))] flex-col md:h-[calc(100dvh-4rem-var(--safe-t))] md:min-h-0">
      <div className="mx-auto grid w-full max-w-6xl flex-1 content-start gap-x-10 gap-y-8 px-(--gutter) pt-2 pb-10 md:min-h-0 md:grid-cols-[minmax(0,21rem)_minmax(0,1fr)] md:gap-x-6 md:pb-4 lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-x-10">
        <section className="min-w-0 md:-mx-1 md:max-h-full md:overflow-y-auto md:overscroll-contain md:px-1 md:pb-2">
          <div className="card overflow-hidden">
            <div
              className={`flex min-h-12 items-center justify-between gap-3 px-5 py-2 ${
                tone ? 'text-on-flat' : 'bg-back text-white'
              }`}
              style={tone ? { background: flat(tone) } : undefined}
            >
              <span className="display min-w-0 text-[1.05rem] leading-tight font-bold wrap-break-word">
                {topic}
              </span>
              <span className="shrink-0 text-[0.8125rem] font-semibold opacity-80">
                Scorecard
              </span>
            </div>
            <div className="px-5 pt-6 pb-5 text-center">
              <h1 className="sr-only">
                {s.score} of {s.total}. {verdict(s.ratio)}
              </h1>
              <Score score={s.score} total={s.total} />
              <Stamp ratio={s.ratio} />
              <div className="mt-5">
                <Strip questions={questions} answers={answers} />
              </div>

              <dl className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ['Best streak', s.bestStreak],
                  ['Avg time', formatSeconds(s.avgMs)],
                  ['Missed', misses],
                ].map(([k, v]) => (
                  <div key={k} className="tact px-2 py-2.5 [--edge:3px]">
                    <dt className="text-xs font-medium text-muted">{k}</dt>
                    <dd className="display mt-0.5 text-[1.45rem] font-extrabold tabular-nums">
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              {difficulties.length > 1 && (
                <div className="mt-5 space-y-2.5 text-left">
                  {difficulties.map(([d, v]) => (
                    <div key={d} className="flex items-center gap-3 text-sm">
                      <span className="flex w-22 shrink-0 items-center gap-2 font-semibold text-ink-2 capitalize">
                        <Pips level={d} />
                        {d}
                      </span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
                        <motion.span
                          className="block h-full origin-left rounded-full bg-brand"
                          initial={{ transform: 'scaleX(0)' }}
                          animate={{
                            transform: `scaleX(${v.right / v.total})`,
                          }}
                          transition={{ delay: 0.4, duration: 0.6, ease: EASE }}
                        />
                      </span>
                      <span className="display w-10 shrink-0 text-right font-bold text-muted tabular-nums">
                        {v.right}/{v.total}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 hidden text-left md:block">
                <div className="flex gap-2">{again}</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onNew}
                    className="btn btn-plain tact press px-3"
                  >
                    Change topic
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    className="btn btn-plain tact press px-3"
                  >
                    <ExportIcon weight="bold" size={18} />
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

        <section
          aria-labelledby="review-title"
          className="flex min-w-0 flex-col md:min-h-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="review-title"
              className="display text-[1.6rem] font-extrabold tracking-[-0.02em]"
            >
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
              className="tact press mt-4 flex w-full items-center gap-3 border-yellow-edge/60 bg-yellow p-3 text-left text-on-flat [--edge-color:var(--color-yellow-edge)]"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-on-flat text-yellow">
                <TargetIcon weight="bold" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="display block text-[1.05rem] leading-tight font-bold">
                  Practice the {misses === 1 ? 'one' : misses} you missed
                </span>
                <span className="block text-sm opacity-80">
                  Same cards, reshuffled, no waiting.
                </span>
              </span>
            </button>
          )}

          {/* From tablets up the page holds still and only this list scrolls. */}
          <ol className="mt-4 space-y-3 md:-mx-1 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:px-1 md:pt-0.5 md:pb-3">
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

      <div className="mx-auto w-full max-w-6xl px-(--gutter)">
        <SiteFooter />
      </div>

      <div className="bottom-bar sticky bottom-0 z-20 border-t-2 border-line bg-bg px-(--gutter) pt-3 md:hidden">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNew}
              className="btn btn-plain tact press shrink-0 px-4"
            >
              Topics
            </button>
            {again}
            <button
              type="button"
              onClick={share}
              className="btn btn-plain tact press w-13 shrink-0 px-0 text-brand"
              aria-label="Share result"
              data-tip="Share result"
            >
              <ExportIcon weight="bold" size={19} />
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
