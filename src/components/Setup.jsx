import {
  ArrowsCounterClockwise,
  CaretDown,
  CaretRight,
  Check,
  DiceFive,
  Play,
  Target,
  UserCircleMinus,
  Warning,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useCategoryCounts, useTitle } from '../hooks/index.js';
import { ANY, GROUPS, TONE } from '../lib/categories.js';
import { haptic, prefsStore, setPref, useStore } from '../lib/store.js';
import RollingNumber from './RollingNumber.jsx';
import Segmented, { Choice } from './Segmented.jsx';
import Sheet from './Sheet.jsx';
import Stickers from './Stickers.jsx';

const AMOUNTS = [5, 10, 15, 20, 30, 50];
const nf = new Intl.NumberFormat('en');

const ABOUT = [
  [UserCircleMinus, 'No account. Scores live in your browser.'],
  [
    ArrowsCounterClockwise,
    'Seen a question? It sits out for the next six hours.',
  ],
  [Target, 'Get some wrong and you can replay just those.'],
];

function About({ className }) {
  return (
    <ul className={`space-y-2.5 text-[0.95rem] text-ink-2 ${className}`}>
      {ABOUT.map(([Icon, text]) => (
        <li key={text} className="flex items-start gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface text-muted">
            <Icon size={17} weight="duotone" />
          </span>
          <span className="pt-0.5">{text}</span>
        </li>
      ))}
    </ul>
  );
}

function TopicTile({ topic, count, active, onSelect, wide }) {
  const Icon = topic.icon;
  return (
    <Choice
      name="topic"
      checked={active}
      onSelect={onSelect}
      className={`tile relative flex rounded-[1.25rem] p-3 ${
        wide
          ? 'items-center gap-3'
          : 'min-h-24 flex-col justify-between gap-3 sm:min-h-28'
      } ${
        active
          ? 'bg-tint text-tint-ink shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
          : 'bg-raised shadow-[inset_0_0_0_1px_var(--color-line)] hover-fine:bg-surface'
      }`}
    >
      <span className="flex items-start justify-between gap-2">
        <span
          className={`tile-badge grid size-11 place-items-center rounded-[0.9rem] ${TONE[topic.tone]}`}
        >
          <Icon size={24} weight="duotone" />
        </span>
        {!wide && (
          <span
            className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 font-mono text-[0.68rem] tabular-nums ${
              active ? 'bg-accent text-on-accent' : 'text-muted'
            }`}
          >
            {active ? (
              <Check size={13} weight="bold" />
            ) : count != null ? (
              nf.format(count)
            ) : (
              ''
            )}
          </span>
        )}
      </span>
      <span className={wide ? 'min-w-0 flex-1' : 'min-w-0'}>
        <span className="block truncate text-[0.95rem] leading-tight font-medium">
          {topic.label}
        </span>
        {wide && (
          <span className="block text-xs text-muted">
            A bit of everything
            {count != null ? `, ${nf.format(count)} questions` : ''}
          </span>
        )}
      </span>
      {wide && active && (
        <span className="grid size-6 place-items-center rounded-full bg-accent text-on-accent">
          <Check size={13} weight="bold" />
        </span>
      )}
    </Choice>
  );
}

function TopicSheet({ open, onClose, categories, counts, value, onChange }) {
  const grouped = useMemo(
    () =>
      GROUPS.map((g) => [g, categories.filter((c) => c.group === g)]).filter(
        ([, l]) => l.length,
      ),
    [categories],
  );
  const pick = (id) => {
    onChange(id);
    setTimeout(onClose, 160);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Pick a topic" wide>
      <fieldset className="space-y-6">
        <legend className="sr-only">Topic</legend>
        <TopicTile
          topic={ANY}
          count={counts?.total}
          active={!value}
          onSelect={() => pick('')}
          wide
        />
        {grouped.map(([group, list]) => (
          <div key={group}>
            <h3 className="eyebrow mb-2.5">{group}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((c) => (
                <TopicTile
                  key={c.id}
                  topic={c}
                  count={counts?.byCategory[c.id]}
                  active={value === c.id}
                  onSelect={() => pick(c.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </fieldset>
    </Sheet>
  );
}

export default function Setup({ categories, counts, status, onStart }) {
  useTitle('QuizzMe! · Quick trivia rounds');
  const prefs = useStore(prefsStore);
  const catCounts = useCategoryCounts(prefs.category);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [more, setMore] = useState(false);

  const current = prefs.category
    ? categories.find((c) => c.id === prefs.category)
    : null;
  const topic = current ?? ANY;
  const TopicIcon = topic.icon;
  const topicCount = prefs.category
    ? counts?.byCategory[prefs.category]
    : counts?.total;

  const available = prefs.category
    ? (catCounts?.[prefs.difficulty] ?? null)
    : prefs.difficulty
      ? null
      : (counts?.total ?? null);

  const amounts = useMemo(() => {
    if (available == null) return AMOUNTS;
    const list = AMOUNTS.filter((n) => n <= available);
    if (available < 50 && !list.includes(available)) list.push(available);
    return list;
  }, [available]);

  const amount = amounts.includes(prefs.amount)
    ? prefs.amount
    : Math.min(prefs.amount, amounts.at(-1) ?? 1);
  const noQuestions = available === 0;

  const start = () => {
    haptic(12);
    onStart({ ...prefs, amount });
  };

  const surprise = () => {
    haptic(12);
    const pick = categories[Math.floor(Math.random() * categories.length)];
    setPref('category', pick.id);
    setPref('difficulty', '');
    onStart({
      ...prefs,
      category: pick.id,
      difficulty: '',
      type: '',
      amount: 10,
    });
  };

  const hint = (d) => {
    if (!prefs.category) return null;
    return <RollingNumber value={catCounts?.[d] ?? null} />;
  };

  const moreSummary = [
    {
      '': 'Mixed types',
      multiple: 'Multiple choice',
      boolean: 'True or false',
    }[prefs.type],
    prefs.mode === 'instant' ? 'answers as you go' : 'answers at the end',
    prefs.timer ? `${prefs.timer}s timer` : 'no timer',
  ].join(', ');

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem-var(--safe-t))] max-w-6xl flex-col px-(--gutter)">
      <div className="grid flex-1 items-center gap-x-16 gap-y-6 pt-2 pb-5 [@media(max-height:700px)]:gap-y-4 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <section className="min-w-0">
          <div className="[@media(max-height:700px)]:hidden">
            <Stickers />
          </div>
          <h1 className="mt-5 font-display [@media(max-height:700px)]:mt-0 text-[clamp(2.3rem,7.4vw,4.6rem)] leading-[0.95] font-semibold tracking-[-0.035em] sm:mt-8">
            Settle a bet. <span className="text-accent">Or start one.</span>
          </h1>
          <p className="mt-3 max-w-lg [@media(max-height:700px)]:hidden text-[1.02rem] text-muted sm:mt-5 sm:text-lg">
            Quick trivia rounds on 24 topics. The questions come straight from
            Open Trivia DB, so I don't know what's next either.
          </p>
          <About className="mt-8 hidden lg:block" />
        </section>

        <section aria-labelledby="round-title" className="card p-4 sm:p-5">
          <h2 id="round-title" className="sr-only">
            Your round
          </h2>

          {status === 'offline' && (
            <p className="mb-4 flex items-start gap-2.5 rounded-2xl bg-bad-tint p-3 text-sm text-bad-ink">
              <Warning weight="duotone" size={18} className="mt-px shrink-0" />
              Open Trivia DB isn't answering right now. It's usually back in a
              few minutes.
            </p>
          )}

          <button
            type="button"
            onClick={() => setTopicsOpen(true)}
            className="tile press flex w-full items-center gap-3 rounded-[1.25rem] bg-surface p-2 pr-3 text-left hover-fine:bg-surface-2"
          >
            <span
              className={`tile-badge grid size-12 shrink-0 place-items-center rounded-[0.9rem] ${TONE[topic.tone]}`}
            >
              <TopicIcon size={26} weight="duotone" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">Topic</span>
              <span className="block truncate font-display text-lg leading-tight font-semibold">
                {topic.label}
              </span>
            </span>
            <span className="font-mono text-xs text-muted">
              <RollingNumber value={topicCount ?? null} />
            </span>
            <CaretRight
              size={16}
              weight="bold"
              className="tile-caret shrink-0 text-muted"
            />
          </button>

          <div className="mt-4 space-y-4">
            <Segmented
              label="Difficulty"
              value={prefs.difficulty}
              onChange={(v) => setPref('difficulty', v)}
              options={[
                { value: '', label: 'Any', hint: hint('') },
                { value: 'easy', label: 'Easy', hint: hint('easy') },
                { value: 'medium', label: 'Medium', hint: hint('medium') },
                { value: 'hard', label: 'Hard', hint: hint('hard') },
              ]}
            />

            <fieldset>
              <legend className="eyebrow mb-2 flex w-full justify-between">
                <span>Questions</span>
                {available != null && available < 50 && (
                  <span className="inline-flex gap-1 tracking-normal normal-case">
                    <RollingNumber value={available} /> available
                  </span>
                )}
              </legend>
              <div className="grid grid-cols-6 gap-1.5">
                {amounts.map((n) => (
                  <Choice
                    key={n}
                    name="amount"
                    checked={n === amount}
                    onSelect={() => setPref('amount', n)}
                    className={`grid h-11 place-items-center rounded-xl font-mono text-sm tabular-nums ${
                      n === amount
                        ? 'bg-ink text-bg'
                        : 'bg-surface text-ink-2 hover-fine:bg-surface-2'
                    }`}
                  >
                    {n}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl ring-1 ring-line">
              <button
                type="button"
                onClick={() => setMore((m) => !m)}
                aria-expanded={more}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    More options
                  </span>
                  {!more && (
                    <span className="block truncate text-xs text-muted">
                      {moreSummary}
                    </span>
                  )}
                </span>
                <CaretDown
                  size={16}
                  weight="bold"
                  className={`shrink-0 text-muted transition-transform duration-200 ease-out ${more ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {more && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 px-3.5 pt-1 pb-3.5">
                      <Segmented
                        label="Question type"
                        value={prefs.type}
                        onChange={(v) => setPref('type', v)}
                        options={[
                          { value: '', label: 'Mixed' },
                          { value: 'multiple', label: 'Choice' },
                          { value: 'boolean', label: 'True/False' },
                        ]}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Segmented
                          label="Answers"
                          value={prefs.mode}
                          onChange={(v) => setPref('mode', v)}
                          options={[
                            { value: 'instant', label: 'Each' },
                            { value: 'exam', label: 'At end' },
                          ]}
                        />
                        <Segmented
                          label="Timer"
                          value={prefs.timer}
                          onChange={(v) => setPref('timer', v)}
                          options={[
                            { value: 0, label: 'Off' },
                            { value: 15, label: '15s' },
                            { value: 30, label: '30s' },
                          ]}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={start}
              disabled={noQuestions}
              className="btn btn-primary press flex-1"
            >
              <Play size={17} weight="fill" />
              Start quiz
            </button>
            <button
              type="button"
              onClick={surprise}
              className="btn press glass px-4"
              aria-label="Surprise me: a random topic, ten questions"
            >
              <DiceFive size={20} weight="duotone" />
              <span className="hidden min-[400px]:inline">Surprise me</span>
            </button>
          </div>
        </section>
      </div>

      <footer className="bottom-bar flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-muted">
        <span>
          Questions from{' '}
          <a
            className="text-ink-2 underline decoration-line-2 underline-offset-4 hover-fine:decoration-ink-2"
            href="https://opentdb.com"
          >
            Open Trivia DB
          </a>
          , CC BY-SA 4.0
        </span>
        <span>
          Made by{' '}
          <a
            className="text-ink-2 underline decoration-line-2 underline-offset-4 hover-fine:decoration-ink-2"
            href="https://ashwin.co.in"
          >
            Ashwin
          </a>
        </span>
      </footer>

      <TopicSheet
        open={topicsOpen}
        onClose={() => setTopicsOpen(false)}
        categories={categories}
        counts={counts}
        value={prefs.category}
        onChange={(id) => setPref('category', id)}
      />
    </div>
  );
}
