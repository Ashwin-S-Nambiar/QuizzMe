import { ArrowLeft, ArrowRight, Check, Fire, X } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useScrolled, useTitle } from '../hooks/index.js';
import { categoryLabel } from '../lib/categories.js';
import { currentStreak } from '../lib/quiz.js';
import { sfx } from '../lib/sound.js';
import { haptic } from '../lib/store.js';
import Sheet from './Sheet.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

// Long questions step down in size so the answers stay near the fold on
// phones. Tiers follow OpenTDB: median ~65 characters, longest ~140.
function questionSize(text) {
  if (text.length > 110) {
    return 'text-[clamp(1.2rem,3.6vw,1.75rem)] leading-[1.2]';
  }
  if (text.length > 70) {
    return 'text-[clamp(1.35rem,4.1vw,2rem)] leading-[1.15]';
  }
  return 'text-[clamp(1.55rem,4.6vw,2.3rem)] leading-[1.12]';
}

export const DIFFICULTY_STYLE = {
  easy: 'bg-good-tint text-good-ink',
  medium: 'bg-butter text-butter-ink',
  hard: 'bg-bad-tint text-bad-ink',
};

function TimerRing({ seconds, paused, onExpire }) {
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

  const r = 16;
  const len = 2 * Math.PI * r;
  const low = left <= 5 && !paused;

  return (
    <div
      className={`relative grid size-10 shrink-0 place-items-center ${low ? 'text-bad' : 'text-ink-2'}`}
      role="timer"
      aria-label={`${left} seconds left`}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth="3"
        />
        {
          <circle
            cx="20"
            cy="20"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={len}
            className="timer-ring transition-colors duration-200"
            style={{
              '--len': len,
              animationDuration: `${seconds}s`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        }
      </svg>
      <span className="font-mono text-xs font-medium tabular-nums">{left}</span>
    </div>
  );
}

function Progress({ questions, answers, index, mode, onJump }) {
  const n = questions.length;
  const color = (i) => {
    if (i === index) return 'bg-accent';
    const a = answers[i];
    if (!a) return 'bg-surface-2';
    if (mode === 'exam') return 'bg-ink-2';
    return a.choice === questions[i].correct ? 'bg-good' : 'bg-bad';
  };

  if (n > 25) {
    const done = answers.filter(Boolean).length;
    return (
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${Math.max(done, index + 0.5) / n})` }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 gap-1" aria-hidden={mode !== 'exam'}>
      {questions.map((q, i) =>
        mode === 'exam' ? (
          <button
            key={q.id}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}${answers[i] ? ', answered' : ''}`}
            className="group relative flex-1 py-2"
          >
            <span
              className={`block h-1.5 rounded-full transition-colors duration-200 ${color(i)} group-hover:opacity-80`}
            />
          </button>
        ) : (
          <span
            key={q.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${color(i)}`}
          />
        ),
      )}
    </div>
  );
}

function AnswerButton({ label, index, state, onClick, disabled, big }) {
  const reduce = useReducedMotion();
  const shake = state === 'wrong' && !reduce;

  const tone = {
    idle: 'bg-raised shadow-[inset_0_0_0_1px_var(--color-line)] hover-fine:bg-surface hover-fine:shadow-[inset_0_0_0_1px_var(--color-line-2)]',
    chosen:
      'bg-tint text-tint-ink shadow-[inset_0_0_0_1.5px_var(--color-accent)]',
    right:
      'bg-good-tint text-good-ink shadow-[inset_0_0_0_1.5px_var(--color-good)]',
    wrong:
      'bg-bad-tint text-bad-ink shadow-[inset_0_0_0_1.5px_var(--color-bad)]',
    dim: 'bg-raised text-muted opacity-55 shadow-[inset_0_0_0_1px_var(--color-line)]',
  }[state];

  const cap = {
    idle: 'bg-surface text-muted',
    chosen: 'bg-accent text-on-accent',
    right: 'bg-good text-raised',
    wrong: 'bg-bad text-raised',
    dim: 'bg-surface text-faint',
  }[state];

  return (
    <motion.button
      type="button"
      data-sfx="none"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={state === 'chosen'}
      animate={
        shake
          ? {
              transform: [
                'translateX(0px)',
                'translateX(-7px)',
                'translateX(6px)',
                'translateX(-4px)',
                'translateX(2px)',
                'translateX(0px)',
              ],
            }
          : undefined
      }
      transition={{ duration: 0.36, ease: 'easeOut' }}
      className={`press flex w-full items-center gap-3.5 rounded-2xl p-2.5 pr-4 text-left disabled:cursor-default ${tone} ${
        big
          ? 'min-h-24 justify-center sm:min-h-32'
          : 'min-h-15 short:min-h-13 short:py-2'
      }`}
    >
      {!big && (
        <span
          className={`grid size-9 shrink-0 place-items-center rounded-xl font-mono text-sm font-medium transition-colors duration-200 ${cap}`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={state === 'right' || state === 'wrong' ? state : 'letter'}
              initial={{
                opacity: 0,
                transform: 'scale(0.6)',
                filter: 'blur(2px)',
              }}
              animate={{
                opacity: 1,
                transform: 'scale(1)',
                filter: 'blur(0px)',
              }}
              exit={{
                opacity: 0,
                transform: 'scale(0.6)',
                filter: 'blur(2px)',
              }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.35 }}
              className="grid place-items-center"
            >
              {state === 'right' ? (
                <Check weight="bold" size={18} />
              ) : state === 'wrong' ? (
                <X weight="bold" size={18} />
              ) : (
                LETTERS[index]
              )}
            </motion.span>
          </AnimatePresence>
        </span>
      )}
      <span
        className={`min-w-0 text-pretty wrap-break-word ${big ? 'font-display text-2xl font-semibold sm:text-3xl' : 'text-[1.02rem] leading-snug font-medium'}`}
      >
        {label}
      </span>
      {big && (state === 'right' || state === 'wrong') && (
        <motion.span
          initial={{ opacity: 0, transform: 'scale(0.6)', filter: 'blur(2px)' }}
          animate={{ opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0.35 }}
        >
          {state === 'right' ? (
            <Check weight="bold" size={24} />
          ) : (
            <X weight="bold" size={24} />
          )}
        </motion.span>
      )}
    </motion.button>
  );
}

export default function Play({ questions, mode, timer, onFinish, onQuit }) {
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

  useEffect(() => () => clearTimeout(advance.current), []);
  useTitle(`Question ${index + 1} of ${n} · QuizzMe!`);
  const scrolled = useScrolled();

  const go = useCallback(
    (to) => {
      if (to < 0 || to >= n || to === index) return;
      clearTimeout(advance.current);
      setDir(to > index ? 1 : -1);
      setIndex(to);
      started.current = performance.now();
      window.scrollTo({ top: 0 });
    },
    [index, n],
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
          advance.current = setTimeout(() => go(target), timedOut ? 500 : 260);
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

  let status = null;
  if (instant && current) {
    if (current.choice === q.correct) status = streak >= 3 ? 'streak' : 'right';
    else status = current.timedOut ? 'timeout' : 'wrong';
  }

  const nextLabel = instant
    ? isLast
      ? 'See results'
      : 'Next'
    : allAnswered
      ? 'Finish'
      : isLast
        ? `${n - answeredCount} left`
        : 'Next';

  const nextDisabled = instant ? !current : false;

  const variants = {
    enter: (d) => ({
      opacity: 0,
      transform: reduce ? 'none' : `translateX(${d * 16}px)`,
      filter: reduce ? 'none' : 'blur(2px)',
    }),
    center: { opacity: 1, transform: 'translateX(0px)', filter: 'blur(0px)' },
    exit: (d) => ({
      opacity: 0,
      transform: reduce ? 'none' : `translateX(${d * -16}px)`,
      filter: reduce ? 'none' : 'blur(2px)',
      transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] },
    }),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header
        className={`sticky top-0 z-20 pt-(--safe-t) transition-[background-color,box-shadow] duration-200 ${
          scrolled
            ? 'bg-bg/92 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl backdrop-saturate-150'
            : ''
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center gap-3 px-(--gutter)">
          <button
            type="button"
            onClick={() => setQuitting(true)}
            className="icon-btn press glass shrink-0"
            aria-label="Leave quiz"
          >
            <X weight="bold" size={18} />
          </button>
          <Progress
            questions={questions}
            answers={answers}
            index={index}
            mode={mode}
            onJump={go}
          />
          <span className="w-12 shrink-0 text-right font-mono text-sm text-muted tabular-nums">
            {index + 1}/{n}
          </span>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-2xl flex-1 px-(--gutter) pt-6 pb-8 short:pt-3 sm:pt-10">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.section
            key={q.id}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            aria-labelledby={`${q.id}-text`}
            className="w-full"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
                <span className="rounded-full bg-surface px-2.5 py-1 text-ink-2">
                  {categoryLabel(q.category)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 capitalize ${DIFFICULTY_STYLE[q.difficulty]}`}
                >
                  {q.difficulty}
                </span>
              </div>
              {timer > 0 && (
                <TimerRing
                  seconds={timer}
                  key={q.id}
                  paused={current != null}
                  onExpire={() => choose(null, true)}
                />
              )}
            </div>
            <h2
              id={`${q.id}-text`}
              className={`mt-4 font-display font-semibold tracking-[-0.02em] text-pretty wrap-break-word short:mt-3 ${questionSize(q.question)}`}
            >
              {q.question}
            </h2>
            <div
              ref={list}
              className={`mt-8 grid gap-2.5 short:mt-5 short:gap-2 ${q.type === 'boolean' ? 'grid-cols-2' : ''}`}
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
          </motion.section>
        </AnimatePresence>
      </main>

      <footer
        ref={bar}
        className="bottom-bar sticky bottom-0 z-20 border-t border-line bg-bg/92 pt-3 backdrop-blur-xl"
      >
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-(--gutter)">
          {!instant && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="icon-btn press glass size-12! shrink-0 disabled:opacity-40"
              aria-label="Previous question"
            >
              <ArrowLeft weight="bold" size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1 text-sm" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
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
                className="flex items-center gap-2"
              >
                {status === 'streak' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-butter px-2.5 py-1 font-medium text-butter-ink">
                    <Fire weight="fill" size={15} />
                    {streak} in a row
                  </span>
                )}
                {status === 'right' && (
                  <span className="font-medium text-good-ink">Correct.</span>
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
                      `${answeredCount}/${n} answered`
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
            className="btn btn-primary press min-w-32 shrink-0"
          >
            {nextLabel}
            <ArrowRight weight="bold" size={17} />
          </button>
        </div>
      </footer>

      <Sheet
        open={quitting}
        onClose={() => setQuitting(false)}
        title="Leave this quiz?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQuitting(false)}
              className="btn press glass"
            >
              Keep going
            </button>
            <button
              type="button"
              onClick={() => {
                setQuitting(false);
                onQuit();
              }}
              className="btn press bg-bad text-raised"
            >
              Leave
            </button>
          </div>
        }
      >
        <p className="text-muted">
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
            className="press mt-4 text-sm font-medium text-accent underline decoration-accent/30 underline-offset-4"
          >
            Score what I have instead
          </button>
        )}
      </Sheet>
    </div>
  );
}
