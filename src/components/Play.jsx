import {
  ArrowLeftIcon,
  CheckIcon,
  FireIcon,
  TimerIcon,
  XIcon,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTitle } from '../hooks/index.js';
import { categoryLabel, categoryTone, flat } from '../lib/categories.js';
import { currentStreak } from '../lib/quiz.js';
import { sfx } from '../lib/sound.js';
import { buzz } from '../lib/store.js';
import { Pips } from './Pips.jsx';
import Sheet from './Sheet.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];
const EASE = [0.23, 1, 0.32, 1];

// Long questions step down in size so the answers stay near the fold on
// phones. Tiers follow OpenTDB: median ~65 characters, longest ~250.
function questionSize(text) {
  if (text.length > 140) return 'text-[clamp(1.1rem,3.2vw,1.45rem)]';
  if (text.length > 90) return 'text-[clamp(1.2rem,3.6vw,1.65rem)]';
  if (text.length > 55) return 'text-[clamp(1.3rem,4vw,1.85rem)]';
  return 'text-[clamp(1.45rem,4.6vw,2.1rem)]';
}

// The timer counts whole seconds on the card's band and drains a fuse along
// its bottom edge. The CSS animation draws; the interval counts and expires.
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
        className={`display flex min-w-12 items-center justify-end gap-1 text-base font-bold tabular-nums transition-colors duration-200 ${low ? 'text-bad-edge' : ''}`}
        role="timer"
        aria-label={`${left} seconds left`}
      >
        <TimerIcon size={16} weight="bold" />
        {left}
      </span>
      <span
        className="absolute inset-x-0 bottom-0 h-1 bg-on-flat/15"
        aria-hidden="true"
      >
        <span
          className={`fuse block h-full transition-colors duration-200 ${low ? 'bg-bad' : 'bg-on-flat/70'}`}
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
  const done = answers.filter(Boolean).length;

  if (mode !== 'exam' || n > 25) {
    return (
      <div
        className="h-3.5 flex-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={n}
        aria-valuenow={done}
        aria-label="Cards answered"
      >
        <div
          className="h-full origin-left rounded-full bg-brand shadow-[inset_0_3px_0_rgb(255_255_255/0.25)] transition-transform duration-500 ease-out"
          style={{ transform: `scaleX(${Math.max(done, 0.35) / n})` }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-1">
      {questions.map((q, i) => (
        <button
          key={q.id}
          type="button"
          onClick={() => onJump(i)}
          aria-label={`Card ${i + 1}${answers[i] ? ', answered' : ''}`}
          aria-current={i === index ? 'step' : undefined}
          className="group relative flex-1 py-3"
        >
          <span
            className={`block h-3 rounded-full transition-[background-color,scale] duration-200 group-hover:scale-y-125 ${
              i === index ? 'bg-brand' : answers[i] ? 'bg-lilac' : 'bg-line'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function Tick({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 20 20"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <motion.path
        d="M4.5 10.5l3.8 3.8L15.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.28, ease: EASE, delay: 0.05 }}
      />
    </svg>
  );
}

function Cross({ size = 18 }) {
  return (
    <svg
      viewBox="0 0 20 20"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {['M5.5 5.5l9 9', 'M14.5 5.5l-9 9'].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
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

const TONE = {
  idle: '',
  chosen:
    'border-brand bg-lilac-soft text-brand-ink [--edge-color:var(--color-brand)]',
  right:
    'border-good bg-good-tint text-good-ink [--edge-color:var(--color-good-edge)]',
  wrong:
    'border-bad bg-bad-tint text-bad-ink [--edge-color:var(--color-bad-edge)]',
  dim: 'opacity-45',
};

const KEY = {
  idle: 'border-line text-muted',
  chosen: 'border-brand bg-brand text-on-brand',
  right: 'border-good bg-good text-white',
  wrong: 'border-bad bg-bad text-white',
  dim: 'border-line text-faint',
};

function AnswerButton({ label, index, state, onClick, disabled, big }) {
  const reduce = useReducedMotion();
  const shake = state === 'wrong' && !reduce;

  return (
    <motion.button
      type="button"
      data-sfx="none"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === 'chosen'}
      animate={shake ? SHAKE : undefined}
      transition={{ duration: 0.34, ease: 'easeOut' }}
      className={`tact press flex w-full min-w-0 items-center text-left disabled:cursor-default ${TONE[state]} ${
        big
          ? 'min-h-24 flex-col justify-center gap-1 px-3 sm:min-h-28'
          : 'min-h-14 gap-3 py-2 pr-4 pl-2 short:min-h-12 short:py-1.5'
      }`}
    >
      {!big && (
        <span
          className={`display grid size-9 shrink-0 place-items-center rounded-[10px] border-2 text-[0.95rem] font-bold transition-colors duration-200 ${KEY[state]}`}
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
            ? 'display text-[1.6rem] font-bold sm:text-[1.9rem]'
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
      {big && state === 'right' && <Tick size={22} />}
      {big && state === 'wrong' && <Cross size={22} />}
    </motion.button>
  );
}

// A card thrown off the deck going forward; pulled back going back. The next
// card rises from the deck underneath. Every state keeps the same transform
// shape so Motion can interpolate it.
const card = (x, y, r, s) =>
  `translate(${x}%, ${y}px) rotate(${r}deg) scale(${s})`;
const cardMotion = {
  enter: (d) =>
    d > 0
      ? { opacity: 0, transform: card(0, 20, 0, 0.96), zIndex: 1 }
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
          transform: card(0, 20, 0, 0.96),
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

const BANNER = {
  idle: 'border-line bg-bg',
  right: 'border-good-line bg-good-tint',
  streak: 'border-good-line bg-good-tint',
  wrong: 'border-bad-line bg-bad-tint',
  timeout: 'border-bad-line bg-bad-tint',
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
  useTitle(`Card ${index + 1} of ${n} · QuizzMe!`);

  const go = useCallback(
    (to) => {
      if (to < 0 || to >= n || to === index) return;
      clearTimeout(advance.current);
      setDir(to > index ? 1 : -1);
      setIndex(to);
      sfx.flip();
      buzz.flip();
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
          bottom > barTop - 16 ? bottom - barTop + 16 : Math.min(top - 80, 0);
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
        revealCorrect(q.answers.indexOf(q.correct));
        if (choice === q.correct) {
          const streak = currentStreak(questions, next, index);
          sfx.right(streak);
          if (streak >= 3) buzz.streak();
          else buzz.right();
        } else {
          if (timedOut) sfx.timeout();
          else sfx.wrong();
          buzz.wrong();
        }
        return;
      }
      if (timedOut) {
        sfx.timeout();
        buzz.wrong();
      } else {
        sfx.pick();
        buzz.select();
      }
      if (wasEmpty || timedOut) {
        const target = next.findIndex((a, i) => !a && i > index);
        if (target !== -1)
          advance.current = setTimeout(() => go(target), timedOut ? 500 : 340);
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

  let status = 'idle';
  if (instant && current) {
    if (current.choice === q.correct) status = streak >= 3 ? 'streak' : 'right';
    else status = current.timedOut ? 'timeout' : 'wrong';
  }
  const good = status === 'right' || status === 'streak';
  const bad = status === 'wrong' || status === 'timeout';

  const nextLabel = instant
    ? isLast
      ? 'See results'
      : 'Next card'
    : allAnswered
      ? 'Finish'
      : isLast
        ? `${n - answeredCount} left`
        : 'Next card';

  const topBar = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2, ease: EASE }}
      className="pointer-events-auto mx-auto flex h-full w-full max-w-3xl items-center gap-3 px-(--gutter)"
    >
      <button
        type="button"
        onClick={() => setQuitting(true)}
        className="icon-btn press -ml-2 shrink-0"
        aria-label="Leave quiz"
        data-tip="Leave quiz"
      >
        <XIcon weight="bold" size={20} />
      </button>
      <Progress
        questions={questions}
        answers={answers}
        index={index}
        mode={mode}
        onJump={go}
      />
      <span className="display shrink-0 text-right text-[0.95rem] font-bold text-ink-2 tabular-nums">
        {index + 1} of {n}
      </span>
    </motion.div>
  );

  return (
    <div className="flex min-h-[calc(100dvh-4rem-var(--safe-t))] flex-col">
      {barSlot ? createPortal(topBar, barSlot) : null}

      <main className="relative mx-auto w-full max-w-3xl flex-1 px-(--gutter) pt-2 pb-12 short:pb-8 sm:pt-6">
        <div className="relative">
          {/* The rest of the deck, peeking out under the current card. */}
          {[2, 1].map((k) => (
            <div
              key={k}
              className="card absolute inset-0 transition-[opacity,translate,scale] duration-300 ease-out"
              style={{
                translate: `0 ${k * 10}px`,
                scale: `${1 - k * 0.045} 1`,
                opacity: remaining >= k ? 1 : 0,
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
                className="relative flex min-h-12 items-center justify-between gap-3 px-4 py-2 text-on-flat sm:px-6"
                style={{ background: flat(tone) }}
              >
                <span className="display min-w-0 text-[1.05rem] leading-tight font-bold wrap-break-word">
                  {categoryLabel(q.category)}
                </span>
                <span className="flex shrink-0 items-center gap-3 text-[0.8125rem] font-semibold">
                  <span className="flex items-center gap-1.5 capitalize">
                    <Pips level={q.difficulty} />
                    {q.difficulty}
                  </span>
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
              <div className="p-4 pt-5 short:pt-4 sm:p-6 sm:pt-7">
                <h2
                  id={`${q.id}-text`}
                  className={`display leading-[1.2] font-bold text-pretty wrap-break-word ${questionSize(q.question)}`}
                >
                  {q.question}
                </h2>
                <div
                  ref={list}
                  className={`mt-5 grid gap-x-2.5 gap-y-3 short:mt-4 short:gap-y-2.5 sm:mt-7 ${
                    q.type === 'boolean' ? 'grid-cols-2' : 'md:grid-cols-2'
                  }`}
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

      {/* The feedback banner. Its height never changes: only its colour and
          the words in it do, so answering never moves the page. */}
      <footer
        ref={bar}
        className={`bottom-bar sticky bottom-0 z-20 border-t-2 pt-3 transition-colors duration-200 short:pt-2 sm:pt-4 ${BANNER[status]}`}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-(--gutter) short:gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {!instant && (
              <button
                type="button"
                onClick={() => go(index - 1)}
                disabled={index === 0}
                className="tact press grid size-11 shrink-0 place-items-center text-ink-2 disabled:opacity-40"
                aria-label="Previous card"
                data-tip="Previous card"
              >
                <ArrowLeftIcon weight="bold" size={18} />
              </button>
            )}
            {/* Tall enough for a heading and two lines of answer, in every
                state, so the banner never grows. */}
            <div className="slot min-h-17 min-w-0 flex-1" aria-live="polite">
              <AnimatePresence initial={false}>
                <motion.div
                  key={status === 'idle' ? `idle-${instant}` : status}
                  initial={{ opacity: 0, transform: 'translateY(6px)' }}
                  animate={{ opacity: 1, transform: 'translateY(0px)' }}
                  exit={{
                    opacity: 0,
                    transform: 'translateY(-4px)',
                    transition: { duration: 0.12 },
                  }}
                  transition={{ type: 'spring', duration: 0.34, bounce: 0.2 }}
                  className="flex min-w-0 items-center gap-3 self-center"
                >
                  {status !== 'idle' && (
                    <span
                      className={`grid size-10 shrink-0 place-items-center rounded-full ${
                        good ? 'bg-good text-white' : 'bg-bad text-white'
                      } dark:text-bg`}
                    >
                      {good ? (
                        <CheckIcon weight="bold" size={20} />
                      ) : (
                        <XIcon weight="bold" size={20} />
                      )}
                    </span>
                  )}
                  {good && (
                    <p className="min-w-0 flex-1">
                      <span className="display block text-xl leading-tight font-extrabold text-good-ink">
                        Correct
                      </span>
                      <span className="block text-[0.95rem] text-good-ink/85">
                        {status === 'streak' ? 'On a roll.' : 'Nice one.'}
                      </span>
                    </p>
                  )}
                  {status === 'streak' && (
                    <span className="display inline-flex shrink-0 items-center gap-1 rounded-full bg-yellow px-2.5 py-1 text-sm font-bold text-on-flat">
                      <FireIcon weight="fill" size={15} />
                      {streak} in a row
                    </span>
                  )}
                  {bad && (
                    <p className="min-w-0 flex-1">
                      <span className="display block text-xl leading-tight font-extrabold text-bad-ink">
                        {status === 'timeout' ? 'Out of time' : 'Not quite'}
                      </span>
                      <span className="line-clamp-2 block text-[0.95rem] leading-snug text-bad-ink/90">
                        It was{' '}
                        <strong className="font-semibold">{q.correct}</strong>.
                      </span>
                    </p>
                  )}
                  {status === 'idle' && (
                    <p className="text-[0.95rem] text-muted">
                      {instant ? (
                        <>
                          Pick an answer
                          <span className="hidden pointer-fine:inline">
                            , or press 1 to {q.answers.length}
                          </span>
                          .
                        </>
                      ) : (
                        `${answeredCount} of ${n} answered`
                      )}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <button
            type="button"
            onClick={next}
            disabled={instant && !current}
            className={`btn press w-full shrink-0 sm:w-auto sm:min-w-44 ${
              good ? 'btn-good' : bad ? 'btn-bad' : 'btn-brand'
            }`}
          >
            {nextLabel}
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
              className="btn btn-plain tact press"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={() => {
                setQuitting(false);
                onQuit();
              }}
              className="btn btn-bad press"
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
            className="press mt-4 text-sm font-semibold text-brand-ink underline decoration-lilac decoration-2 underline-offset-4 hover-fine:decoration-brand"
          >
            Score what I have instead
          </button>
        )}
      </Sheet>
    </div>
  );
}
