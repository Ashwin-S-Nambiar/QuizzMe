import { ArrowLeft, ArrowRight, Fire, X } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTitle } from '../hooks/index.js';
import { categoryLabel, categoryTone, flat } from '../lib/categories.js';
import { currentStreak } from '../lib/quiz.js';
import { sfx } from '../lib/sound.js';
import { haptic } from '../lib/store.js';
import { Pips } from './Pips.jsx';
import Sheet from './Sheet.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];
const EASE = [0.23, 1, 0.32, 1];

// Long questions step down in size so the answers stay near the fold on
// phones. Tiers follow OpenTDB: median ~65 characters, longest ~140.
function questionSize(text) {
  if (text.length > 110) {
    return 'text-[clamp(1.15rem,3.4vw,1.6rem)] leading-[1.25]';
  }
  if (text.length > 70) {
    return 'text-[clamp(1.3rem,3.9vw,1.85rem)] leading-[1.2]';
  }
  return 'text-[clamp(1.45rem,4.4vw,2.15rem)] leading-[1.15]';
}

// The timer is a fuse along the top edge of the card. The CSS animation does
// the drawing; the interval only counts whole seconds and fires expiry.
function Fuse({ seconds, paused, onExpire }) {
  const [left, setLeft] = useState(seconds);
  const deadline = useRef(0);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (paused) return;
    deadline.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    let shown = seconds;
    const id = setInterval(() => {
      const ms = deadline.current - Date.now();
      const next = Math.max(0, Math.ceil(ms / 1000));
      if (next !== shown) {
        shown = next;
        if (next > 0 && next <= 3) sfx.tick();
      }
      setLeft(next);
      if (ms <= 0) {
        clearInterval(id);
        expire.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [seconds, paused]);

  const low = left <= 5 && !paused;

  return (
    <>
      <span
        className={`printed w-7 text-right text-lg transition-colors duration-200 ${low ? 'text-bad-ink' : ''}`}
        role="timer"
        aria-label={`${left} seconds left`}
      >
        {left}
      </span>
      <span
        className="absolute inset-x-0 bottom-0 h-1 bg-on-flat/15"
        aria-hidden="true"
      >
        <span
          className={`fuse block h-full transition-colors duration-200 ${low ? 'bg-bad' : 'bg-on-flat'}`}
          style={{
            animationDuration: `${seconds}s`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      </span>
    </>
  );
}

function Progress({ questions, answers, index, mode, onJump }) {
  const n = questions.length;
  const color = (i) => {
    if (i === index) return 'bg-ink';
    const a = answers[i];
    if (!a) return 'bg-line-2';
    if (mode === 'exam') return 'bg-ink-2/45';
    return a.choice === questions[i].correct ? 'bg-good' : 'bg-bad';
  };

  if (n > 25) {
    const done = answers.filter(Boolean).length;
    return (
      <div className="h-2 flex-1 overflow-hidden rounded-[2px] bg-line-2">
        <div
          className="h-full origin-left bg-ink transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${Math.max(done, index + 0.5) / n})` }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-[3px]" aria-hidden={mode !== 'exam'}>
      {questions.map((q, i) =>
        mode === 'exam' ? (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}${answers[i] ? ', answered' : ''}`}
            className="group relative flex-1 py-2.5"
          >
            <span
              className={`block h-2 rounded-[2px] transition-[background-color,scale] duration-200 ${color(i)} group-hover:scale-y-150`}
            />
          </button>
        ) : (
          <span
            key={q.id}
            className={`h-2 flex-1 rounded-[2px] transition-colors duration-300 ${color(i)}`}
          />
        ),
      )}
    </div>
  );
}

function Tick() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden="true">
      <motion.path
        d="M4.5 10.5l3.8 3.8L15.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.28, ease: EASE, delay: 0.05 }}
      />
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden="true">
      {['M5.5 5.5l9 9', 'M14.5 5.5l-9 9'].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.18, ease: EASE, delay: 0.05 + i * 0.12 }}
        />
      ))}
    </svg>
  );
}

const SHAKE = {
  transform: [
    'translateX(0px)',
    'translateX(-6px)',
    'translateX(5px)',
    'translateX(-3px)',
    'translateX(1px)',
    'translateX(0px)',
  ],
};

function AnswerButton({ label, index, state, onClick, disabled, big }) {
  const reduce = useReducedMotion();
  const shake = state === 'wrong' && !reduce;
  const marked = state === 'right' || state === 'wrong';

  const tone = {
    idle: 'shadow-[inset_0_0_0_1px_var(--color-line-2)] hover-fine:bg-bg-2/70 hover-fine:shadow-[inset_0_0_0_1px_var(--color-ink)]',
    chosen: 'bg-ink text-card shadow-[inset_0_0_0_1px_var(--color-ink)]',
    right:
      'bg-good-tint text-good-ink shadow-[inset_0_0_0_1.5px_var(--color-good)]',
    wrong:
      'bg-bad-tint text-bad-ink shadow-[inset_0_0_0_1.5px_var(--color-bad)]',
    dim: 'text-muted opacity-50 shadow-[inset_0_0_0_1px_var(--color-line)]',
  }[state];

  const cap = {
    idle: 'bg-bg-2 text-ink-2',
    chosen: 'bg-card text-ink',
    right: 'bg-good text-card',
    wrong: 'bg-bad text-card',
    dim: 'bg-bg-2 text-faint',
  }[state];

  return (
    <motion.button
      type="button"
      data-sfx="none"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === 'chosen'}
      animate={shake ? SHAKE : undefined}
      transition={{ duration: 0.34, ease: 'easeOut' }}
      className={`press flex w-full items-center gap-3 rounded-[10px] p-2 pr-3.5 text-left disabled:cursor-default ${tone} ${
        big
          ? 'min-h-24 flex-col justify-center gap-1.5 sm:min-h-28'
          : 'min-h-14 short:min-h-12'
      }`}
    >
      {!big && (
        <span
          className={`printed grid size-9 shrink-0 place-items-center rounded-[7px] text-lg transition-colors duration-200 ${cap}`}
        >
          {state === 'right' ? (
            <Tick />
          ) : state === 'wrong' ? (
            <Cross />
          ) : (
            LETTERS[index]
          )}
        </span>
      )}
      <span
        className={`min-w-0 wrap-break-word ${
          big
            ? 'printed text-[2.1rem] uppercase sm:text-[2.5rem]'
            : 'text-[1.02rem] leading-snug font-medium text-pretty'
        }`}
      >
        <span
          className="bg-no-repeat transition-[background-size] duration-300 ease-out [box-decoration-break:clone]"
          style={{
            backgroundImage: 'linear-gradient(currentColor, currentColor)',
            backgroundPosition: '0 58%',
            backgroundSize: state === 'wrong' ? '100% 2px' : '0% 2px',
          }}
        >
          {label}
        </span>
      </span>
      {big && marked && (state === 'right' ? <Tick /> : <Cross />)}
    </motion.button>
  );
}

// A card thrown to the discard pile going forward; pulled back off it going
// back. The next card rises from the deck underneath.
// Every state keeps the same transform shape so Motion can interpolate it.
const card = (x, y, r, s) =>
  `translate(${x}%, ${y}px) rotate(${r}deg) scale(${s})`;
const cardMotion = {
  enter: (d) =>
    d > 0
      ? { opacity: 0, transform: card(0, 16, 0, 0.97), zIndex: 1 }
      : { opacity: 0, transform: card(-56, 0, -7, 1), zIndex: 2 },
  center: {
    opacity: 1,
    transform: card(0, 0, 0, 1),
    zIndex: 1,
    transition: { duration: 0.34, ease: EASE },
  },
  exit: (d) =>
    d > 0
      ? {
          // Stays opaque while it's over the next card, so the two never
          // show through each other; it only fades once it's clear.
          opacity: [1, 1, 0],
          transform: card(-125, 24, -12, 1),
          zIndex: 2,
          transition: { duration: 0.36, ease: [0.4, 0, 0.9, 0.6] },
        }
      : {
          opacity: 0,
          transform: card(0, 16, 0, 0.97),
          zIndex: 0,
          transition: { duration: 0.22, ease: EASE },
        },
};

// Reduced motion: the cards swap in place with a crossfade.
const fadeMotion = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function Play({
  questions,
  mode,
  timer,
  barSlot,
  onFinish,
  onQuit,
}) {
  const n = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState(() => Array(n).fill(null));
  const [dir, setDir] = useState(1);
  const [quitting, setQuitting] = useState(false);
  const started = useRef(performance.now());
  const advance = useRef(0);
  const reduce = useReducedMotion();

  const q = questions[index];
  const current = answers[index];
  const instant = mode === 'instant';
  const locked = instant ? current != null : current?.timedOut === true;
  const allAnswered = answers.every(Boolean);
  const isLast = index === n - 1;
  const tone = categoryTone(q.category);

  useEffect(() => () => clearTimeout(advance.current), []);
  useTitle(`Question ${index + 1} of ${n} · QuizzMe!`);

  const go = useCallback(
    (to) => {
      if (to < 0 || to >= n || to === index) return;
      clearTimeout(advance.current);
      setDir(to > index ? 1 : -1);
      setIndex(to);
      started.current = performance.now();
      if (window.scrollY > 0)
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    },
    [index, n, reduce],
  );

  const finish = useCallback(
    (partial = false) =>
      onFinish(
        answers.map((a) => a ?? { choice: null, ms: 0, skipped: true }),
        partial,
      ),
    [answers, onFinish],
  );

  // On short screens the right answer can sit under the bottom bar; bring it
  // into view once answered so the feedback never points at something hidden.
  const list = useRef(null);
  const bar = useRef(null);
  const revealCorrect = useCallback(
    (i) => {
      requestAnimationFrame(() => {
        const el = list.current?.children[i];
        const barTop = bar.current?.getBoundingClientRect().top;
        if (!el || barTop == null) return;
        const { top, bottom } = el.getBoundingClientRect();
        const by =
          bottom > barTop - 12 ? bottom - barTop + 12 : Math.min(top - 80, 0);
        if (by)
          window.scrollBy({ top: by, behavior: reduce ? 'auto' : 'smooth' });
      });
    },
    [reduce],
  );

  const choose = useCallback(
    (choice, timedOut = false) => {
      if (locked) return;
      const ms = Math.round(performance.now() - started.current);
      const wasEmpty = current == null;
      const next = answers.slice();
      next[index] = { choice, ms, timedOut };
      setAnswers(next);

      if (instant) {
        const right = choice === q.correct;
        revealCorrect(q.answers.indexOf(q.correct));
        haptic(right ? 10 : [14, 70, 14]);
        if (right) sfx.right(currentStreak(questions, next, index));
        else sfx.wrong();
        return;
      }
      haptic(8);
      if (timedOut) sfx.wrong();
      else sfx.pick();
      if (wasEmpty || timedOut) {
        const target = next.findIndex((a, i) => !a && i > index);
        if (target !== -1)
          advance.current = setTimeout(() => go(target), timedOut ? 500 : 320);
      }
    },
    [locked, current, answers, index, instant, q, go, questions, revealCorrect],
  );

  const next = useCallback(() => {
    if (instant) {
      if (!current) return;
      if (isLast) finish();
      else go(index + 1);
      return;
    }
    if (allAnswered) return finish();
    if (!isLast) return go(index + 1);
    go(answers.findIndex((a) => !a));
  }, [instant, current, isLast, finish, go, index, allAnswered, answers]);

  useEffect(() => {
    const onKey = (e) => {
      if (quitting || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const byNumber = Number(k) - 1;
      const byLetter = LETTERS.indexOf(k.toUpperCase());
      const pick = byNumber >= 0 && byNumber < 4 ? byNumber : byLetter;
      if (
        pick >= 0 &&
        pick < q.answers.length &&
        e.target.tagName !== 'INPUT'
      ) {
        e.preventDefault();
        choose(q.answers[pick]);
      } else if (k === 'enter' || k === 'arrowright') {
        if (e.target.tagName === 'BUTTON' && k === 'enter') return;
        e.preventDefault();
        next();
      } else if (k === 'arrowleft' && !instant) {
        go(index - 1);
      } else if (k === 'escape') {
        setQuitting(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quitting, q, choose, next, go, index, instant]);

  const stateOf = (answer) => {
    if (instant && current) {
      if (answer === q.correct) return 'right';
      if (answer === current.choice) return 'wrong';
      return 'dim';
    }
    if (current?.choice === answer) return 'chosen';
    if (current?.timedOut) return 'dim';
    return 'idle';
  };

  const streak =
    instant && current ? currentStreak(questions, answers, index) : 0;
  const answeredCount = answers.filter(Boolean).length;
  const remaining = n - index - 1;

  let status = null;
  if (instant && current) {
    if (current.choice === q.correct) status = streak >= 3 ? 'streak' : 'right';
    else status = current.timedOut ? 'timeout' : 'wrong';
  }

  const nextLabel = instant
    ? isLast
      ? 'See results'
      : 'Next card'
    : allAnswered
      ? 'Finish'
      : isLast
        ? `${n - answeredCount} left`
        : 'Next card';

  const nextDisabled = instant ? !current : false;

  const topBar = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2, ease: EASE }}
      className="pointer-events-auto mx-auto flex h-full w-full max-w-2xl items-center gap-3 px-(--gutter)"
    >
      <button
        type="button"
        onClick={() => setQuitting(true)}
        className="icon-btn press -ml-2 shrink-0"
        aria-label="Leave quiz"
        data-tip="Leave quiz"
      >
        <X weight="bold" size={19} />
      </button>
      <Progress
        questions={questions}
        answers={answers}
        index={index}
        mode={mode}
        onJump={go}
      />
      <span className="printed min-w-14 shrink-0 text-right text-[1.35rem]">
        {String(index + 1).padStart(2, '0')}
        <span className="text-muted">/{n}</span>
      </span>
    </motion.div>
  );

  return (
    <div className="flex min-h-[calc(100dvh-4rem-var(--safe-t))] flex-col">
      {barSlot ? createPortal(topBar, barSlot) : null}

      <main className="relative mx-auto w-full max-w-2xl flex-1 px-(--gutter) pt-3 pb-10 sm:pt-8">
        <div className="relative">
          {/* The rest of the deck, peeking out under the current card. */}
          {[2, 1].map((k) => (
            <div
              key={k}
              className="card-back absolute inset-0 transition-[transform,opacity] duration-300 ease-out"
              style={{
                transform: `translateY(${k * 10}px) scale(${1 - k * 0.035})`,
                opacity: remaining >= k ? 1 - k * 0.25 : 0,
              }}
              aria-hidden="true"
            />
          ))}
          <AnimatePresence mode="popLayout" custom={dir}>
            <motion.section
              key={q.id}
              custom={dir}
              variants={reduce ? fadeMotion : cardMotion}
              initial="enter"
              animate="center"
              exit="exit"
              aria-labelledby={`${q.id}-text`}
              className="card relative w-full overflow-hidden"
            >
              <div
                className="relative flex h-12 items-center justify-between gap-3 px-4 text-on-flat sm:h-13 sm:px-6"
                style={{ background: flat(tone) }}
              >
                <span className="printed truncate text-[1.3rem] uppercase">
                  {categoryLabel(q.category)}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Pips level={q.difficulty} />
                  {timer > 0 && (
                    <Fuse
                      seconds={timer}
                      key={q.id}
                      paused={current != null}
                      onExpire={() => choose(null, true)}
                    />
                  )}
                </span>
              </div>
              <div className="p-4 pt-5 sm:p-6 sm:pt-7">
                <h2
                  id={`${q.id}-text`}
                  className={`font-semibold tracking-[-0.015em] text-pretty wrap-break-word ${questionSize(q.question)}`}
                >
                  {q.question}
                </h2>
                <div
                  ref={list}
                  className={`mt-6 grid gap-2 sm:mt-8 ${q.type === 'boolean' ? 'grid-cols-2' : ''}`}
                >
                  {q.answers.map((a, i) => (
                    <AnswerButton
                      key={a}
                      label={a}
                      index={i}
                      big={q.type === 'boolean'}
                      state={stateOf(a)}
                      disabled={locked}
                      onClick={() => choose(a)}
                    />
                  ))}
                </div>
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </main>

      <footer
        ref={bar}
        className="bottom-bar sticky bottom-0 z-20 border-t border-line bg-bg pt-3"
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-(--gutter)">
          {!instant && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="btn btn-plain press size-12 shrink-0 px-0 disabled:opacity-40"
              aria-label="Previous card"
              data-tip="Previous card"
            >
              <ArrowLeft weight="bold" size={18} />
            </button>
          )}
          <div className="slot min-w-0 flex-1 text-sm" aria-live="polite">
            <AnimatePresence initial={false}>
              <motion.p
                key={status ?? `idle-${instant}`}
                initial={{ opacity: 0, transform: 'translateY(6px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{
                  opacity: 0,
                  transform: 'translateY(-6px)',
                  transition: { duration: 0.12 },
                }}
                transition={{ type: 'spring', duration: 0.34, bounce: 0.2 }}
                className="flex items-center gap-2 self-center"
              >
                {status === 'streak' && (
                  <span className="inline-flex items-center gap-1 rounded-[6px] bg-yellow px-2 py-1 font-semibold text-on-flat">
                    <Fire weight="fill" size={15} />
                    {streak} in a row
                  </span>
                )}
                {status === 'right' && (
                  <span className="font-semibold text-good-ink">Correct.</span>
                )}
                {(status === 'wrong' || status === 'timeout') && (
                  <span className="line-clamp-2 leading-snug text-bad-ink">
                    {status === 'timeout' ? 'Out of time. ' : ''}It was{' '}
                    <strong className="font-semibold">{q.correct}</strong>.
                  </span>
                )}
                {status == null && (
                  <span className="text-muted">
                    {instant ? (
                      <span className="hidden pointer-fine:inline">
                        Press 1 to {q.answers.length} to answer
                      </span>
                    ) : (
                      `${answeredCount} of ${n} answered`
                    )}
                  </span>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={nextDisabled}
            className="btn btn-ink press min-w-36 shrink-0"
          >
            {nextLabel}
            <ArrowRight weight="bold" size={17} />
          </button>
        </div>
      </footer>

      <Sheet
        open={quitting}
        onClose={() => setQuitting(false)}
        title="Leave this round?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQuitting(false)}
              className="btn btn-plain press"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={() => {
                setQuitting(false);
                onQuit();
              }}
              className="btn press bg-bad text-card"
            >
              Leave
            </button>
          </div>
        }
      >
        <p className="text-ink-2">
          You're {answeredCount} of {n} in. Leave now and this round won't
          count.
        </p>
        {answeredCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setQuitting(false);
              finish(true);
            }}
            className="press mt-4 text-sm font-semibold text-ink underline decoration-line-2 underline-offset-4 hover-fine:decoration-ink"
          >
            Score what I have instead
          </button>
        )}
      </Sheet>
    </div>
  );
}
