import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Loading from './components/Loading.jsx';
import Setup from './components/Setup.jsx';
import Toaster from './components/Toaster.jsx';
import Topbar from './components/Topbar.jsx';
import { useTheme, useTrivia } from './hooks/index.js';
import { topicLabel } from './lib/categories.js';
import { fetchQuestions, resetToken } from './lib/opentdb.js';
import { shuffle, summarize } from './lib/quiz.js';
import { sfx } from './lib/sound.js';
import { prefsStore, recordRun, toast } from './lib/store.js';

const loadPlay = () => import('./components/Play.jsx');
const loadResults = () => import('./components/Results.jsx');
const Play = lazy(loadPlay);
const Results = lazy(loadResults);
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

const screenMotion = {
  initial: { opacity: 0, transform: 'translateY(6px)', filter: 'blur(2px)' },
  animate: { opacity: 1, transform: 'translateY(0px)', filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    transform: 'translateY(-4px)',
    filter: 'blur(2px)',
    transition: { duration: 0.12, ease: [0.23, 1, 0.32, 1] },
  },
  transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
};

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const { categories, counts, status } = useTrivia();
  const [screen, setScreen] = useState('setup');
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [waitUntil, setWaitUntil] = useState(0);
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
    const onUp = (e) => {
      const p = press;
      press = null;
      if (!p || target(e) !== p.hit) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) return;
      sfx.tap();
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

  const toSetup = useCallback(() => {
    loader.current?.abort();
    setScreen('setup');
  }, []);

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
    setWaitUntil(0);
    setScreen('loading');
    fetchQuestions(options, { signal: ctrl.signal, onWait: setWaitUntil })
      .then((questions) => {
        if (ctrl.signal.aborted) return;
        setQuiz({ questions, options, practice: false });
        setRound((r) => r + 1);
        setScreen('play');
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setScreen('setup');
        if (error.kind === 'empty') {
          toast(
            'Not enough questions for that mix. Try fewer, or set the type to Mixed.',
          );
        } else if (error.kind === 'exhausted') {
          toast(error.message, {
            duration: 8000,
            action: {
              label: 'Start over',
              onClick: () => resetToken().then(() => start(options)),
            },
          });
        } else {
          toast(error.message, {
            duration: 6000,
            action: { label: 'Retry', onClick: () => start(options) },
          });
        }
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
      setScreen('results');
    },
    [quiz, categories],
  );

  const options = quiz?.options;

  return (
    <MotionConfig reducedMotion="user">
      {screen !== 'play' && (
        <Topbar
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenStats={() => setStatsOpen(true)}
          onHome={lost ? () => location.assign('/') : toSetup}
        />
      )}

      <Suspense fallback={null}>
        {lost ? (
          <NotFound />
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
                  onStart={start}
                />
              </motion.div>
            )}
            {screen === 'loading' && (
              <motion.div key="loading" {...screenMotion}>
                <Loading waitUntil={waitUntil} onCancel={toSetup} />
              </motion.div>
            )}
            {screen === 'play' && quiz && (
              <motion.div key={`play-${round}`} {...screenMotion}>
                <Play
                  questions={quiz.questions}
                  mode={options.mode}
                  timer={options.timer}
                  onFinish={finish}
                  onQuit={toSetup}
                />
              </motion.div>
            )}
            {screen === 'results' && result && (
              <motion.div key={`results-${round}`} {...screenMotion}>
                <Results
                  questions={result.questions}
                  answers={result.answers}
                  topic={
                    quiz.practice
                      ? 'Practice round'
                      : topicLabel(categories, options.category)
                  }
                  shareUrl={linkFor(options)}
                  onPlayAgain={() => start(options)}
                  onPractice={practice}
                  onNew={toSetup}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {statsOpen !== null && (
          <StatsSheet open={statsOpen} onClose={() => setStatsOpen(false)} />
        )}
      </Suspense>
      <Toaster />
    </MotionConfig>
  );
}
