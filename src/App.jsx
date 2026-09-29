import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Setup from './components/Setup.jsx';
import Toaster from './components/Toaster.jsx';
import Topbar from './components/Topbar.jsx';
import { useTheme, useTrivia } from './hooks/index.js';
import { topicLabel } from './lib/categories.js';
import { fetchQuestions, resetToken } from './lib/opentdb.js';
import { shuffle, summarize } from './lib/quiz.js';
import { sfx } from './lib/sound.js';
import { buzz, prefsStore, recordRun } from './lib/store.js';

// Play and Results are split out but never suspend: App waits for their code
// before switching to them, so a screen change can't blank the page.
let Play = null;
let Results = null;
const loadPlay = () =>
  import('./components/Play.jsx').then((m) => {
    Play = m.default;
  });
const loadResults = () =>
  import('./components/Results.jsx').then((m) => {
    Results = m.default;
  });
const StatsSheet = lazy(() => import('./components/StatsSheet.jsx'));
const NotFound = lazy(() => import('./components/NotFound.jsx'));

const SITE = 'https://quizzme.ashwin.co.in';

function readLink() {
  const p = new URLSearchParams(location.search);
  if (![...p.keys()].length) return;
  const next = {};
  if (/^\d+$/.test(p.get('category') ?? '')) next.category = p.get('category');
  if (['easy', 'medium', 'hard'].includes(p.get('difficulty')))
    next.difficulty = p.get('difficulty');
  if (['multiple', 'boolean'].includes(p.get('type')))
    next.type = p.get('type');
  const amount = Number(p.get('amount'));
  if (amount >= 1 && amount <= 50) next.amount = amount;
  prefsStore.set((prefs) => ({ ...prefs, ...next }));
  history.replaceState(null, '', location.pathname);
}

readLink();

function linkFor({ category, difficulty, type, amount }) {
  const p = new URLSearchParams();
  if (category) p.set('category', category);
  if (difficulty) p.set('difficulty', difficulty);
  if (type) p.set('type', type);
  p.set('amount', String(amount));
  return `${SITE}/?${p}`;
}

const EASE = [0.23, 1, 0.32, 1];

const screenMotion = {
  initial: { opacity: 0, transform: 'translateY(10px)' },
  animate: { opacity: 1, transform: 'translateY(0px)' },
  exit: {
    opacity: 0,
    transform: 'translateY(-6px)',
    transition: { duration: 0.15, ease: EASE },
  },
  transition: { duration: 0.26, ease: EASE },
};

// Play brings its own entrance (the card is dealt), so the screen itself
// only fades.
const playMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE } },
  transition: { duration: 0.2, ease: EASE },
};

// A fetch that answers quickly never shows a busy state at all; one that
// doesn't shows it for long enough to read instead of flickering.
const SHOW_AFTER = 250;
const SHOW_AT_LEAST = 450;
const IDLE = { busy: false, shown: false, waitUntil: 0, error: null };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const { categories, counts, status } = useTrivia();
  const [screen, setScreen] = useState('setup');
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [deal, setDeal] = useState(IDLE);
  const [barSlot, setBarSlot] = useState(null);
  const [statsOpen, setStatsOpen] = useState(null);
  const [round, setRound] = useState(0);
  const loader = useRef(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1200));
    idle(() => {
      loadPlay();
      loadResults();
    });
  }, []);

  const lost = location.pathname !== '/' && location.pathname !== '/index.html';

  useEffect(() => {
    // Play on release, not press: a touch that turns into a scroll fires
    // pointercancel (or drifts), so swiping through the page stays silent.
    let press = null;
    const target = (e) =>
      e.target.closest?.('button:not(:disabled), a[href], label.choice');
    const onDown = (e) => {
      press = null;
      if (e.button !== 0 || e.target.closest('[data-sfx="none"]')) return;
      const hit = target(e);
      if (hit) press = { hit, x: e.clientX, y: e.clientY };
    };
    // Each control sounds like what it does: chips pop, the deal buttons
    // riffle, everything else knocks. Answer buttons and the sound toggle
    // play their own (data-sfx="none").
    const onUp = (e) => {
      const p = press;
      press = null;
      if (!p || target(e) !== p.hit) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) return;
      const kind = p.hit.dataset.sfx;
      if (kind && sfx[kind]) sfx[kind]();
      else if (p.hit.matches('label.choice')) sfx.select();
      else sfx.tap();
      if (kind !== 'deal') buzz.tap();
    };
    const onCancel = () => {
      press = null;
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    window.addEventListener('scroll', onCancel, {
      capture: true,
      passive: true,
    });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('scroll', onCancel, { capture: true });
    };
  }, []);

  const cancelDeal = useCallback(() => {
    loader.current?.abort();
    loader.current = null;
    setDeal(IDLE);
  }, []);

  const toSetup = useCallback(() => {
    cancelDeal();
    setScreen('setup');
  }, [cancelDeal]);

  useEffect(() => {
    if (screen === 'setup') return;
    if (history.state?.qz !== true) history.pushState({ qz: true }, '');
  }, [screen]);

  useEffect(() => {
    const onPop = () => {
      if (screenRef.current === 'play') {
        history.pushState({ qz: true }, '');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      } else if (screenRef.current !== 'setup') {
        toSetup();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [toSetup]);

  const start = useCallback((options) => {
    loader.current?.abort();
    const ctrl = new AbortController();
    loader.current = ctrl;
    let shownAt = 0;
    const show = () => {
      shownAt ||= Date.now();
      setDeal((d) => (d.shown ? d : { ...d, shown: true }));
    };
    const timer = setTimeout(show, SHOW_AFTER);
    setDeal({ ...IDLE, busy: true });

    Promise.all([
      fetchQuestions(options, {
        signal: ctrl.signal,
        onWait: (until) => {
          show();
          setDeal((d) => ({ ...d, waitUntil: until }));
        },
      }),
      loadPlay(),
    ])
      .then(async ([questions]) => {
        clearTimeout(timer);
        if (shownAt) await sleep(SHOW_AT_LEAST - (Date.now() - shownAt));
        if (ctrl.signal.aborted) return;
        loader.current = null;
        setQuiz({ questions, options, practice: false });
        setRound((r) => r + 1);
        setScreen('play');
        setDeal(IDLE);
      })
      .catch((error) => {
        clearTimeout(timer);
        if (error.name === 'AbortError' || ctrl.signal.aborted) return;
        loader.current = null;
        let action = { label: 'Retry', run: () => start(options) };
        let message = error.message;
        if (error.kind === 'empty') {
          message =
            'Not enough questions for that mix. Try fewer, or set the type to Mixed.';
          action = null;
        } else if (error.kind === 'exhausted') {
          action = {
            label: 'Start over',
            run: () => resetToken().then(() => start(options)),
          };
        }
        setDeal({ ...IDLE, error: { message, action } });
      });
  }, []);

  const practice = useCallback(() => {
    const missed = result.questions
      .filter((q, i) => result.answers[i].choice !== q.correct)
      .map((q) => ({
        ...q,
        id: `${q.id}-p${Date.now()}`,
        answers: q.type === 'boolean' ? q.answers : shuffle(q.answers),
      }));
    setQuiz((prev) => ({
      questions: shuffle(missed),
      options: prev.options,
      practice: true,
    }));
    setRound((r) => r + 1);
    setScreen('play');
  }, [result]);

  const finish = useCallback(
    (answers, partial) => {
      let questions = quiz.questions;
      let list = answers;
      if (partial) {
        const keep = answers
          .map((a, i) => (a.skipped ? -1 : i))
          .filter((i) => i !== -1);
        questions = keep.map((i) => quiz.questions[i]);
        list = keep.map((i) => answers[i]);
      }
      const s = summarize(questions, list);
      const { options } = quiz;
      recordRun({
        at: Date.now(),
        topic: topicLabel(categories, options.category),
        category: options.category,
        difficulty: options.difficulty,
        type: options.type,
        mode: options.mode,
        score: s.score,
        total: s.total,
        bestStreak: s.bestStreak,
        avgMs: s.avgMs,
        practice: quiz.practice,
      });
      setResult({ questions, answers: list });
      loadResults().then(() => setScreen('results'));
    },
    [quiz, categories],
  );

  const options = quiz?.options;

  const playing = screen === 'play' && !lost;

  return (
    <MotionConfig reducedMotion="user">
      <Topbar
        playing={playing}
        onSlot={setBarSlot}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenStats={() => setStatsOpen(true)}
        onHome={lost ? () => location.assign('/') : toSetup}
      />

      {lost ? (
        <Suspense fallback={null}>
          <NotFound />
        </Suspense>
      ) : (
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={() => window.scrollTo({ top: 0 })}
        >
          {screen === 'setup' && (
            <motion.div key="setup" {...screenMotion}>
              <Setup
                categories={categories}
                counts={counts}
                status={status}
                deal={deal}
                onStart={start}
                onCancel={cancelDeal}
                onDismiss={() => setDeal(IDLE)}
              />
            </motion.div>
          )}
          {screen === 'play' && quiz && Play && (
            <motion.div key={`play-${round}`} {...playMotion}>
              <Play
                questions={quiz.questions}
                mode={options.mode}
                timer={options.timer}
                barSlot={barSlot}
                onFinish={finish}
                onQuit={toSetup}
              />
            </motion.div>
          )}
          {screen === 'results' && result && Results && (
            <motion.div key={`results-${round}`} {...screenMotion}>
              <Results
                questions={result.questions}
                answers={result.answers}
                topic={
                  quiz.practice
                    ? 'Practice round'
                    : topicLabel(categories, options.category)
                }
                tone={
                  quiz.practice || !options.category
                    ? null
                    : categories.find((c) => c.id === options.category)?.tone
                }
                shareUrl={linkFor(options)}
                deal={deal}
                onPlayAgain={() => start(options)}
                onCancel={cancelDeal}
                onDismiss={() => setDeal(IDLE)}
                onPractice={practice}
                onNew={toSetup}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Its own boundary: the first open loads a chunk, and that must not
          blank the screen behind it. */}
      <Suspense fallback={null}>
        {statsOpen !== null && (
          <StatsSheet open={statsOpen} onClose={() => setStatsOpen(false)} />
        )}
      </Suspense>
      <Toaster />
    </MotionConfig>
  );
}
