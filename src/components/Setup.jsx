import {
  CaretDown,
  CaretRight,
  Check,
  DiceFive,
  Warning,
} from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { useCategoryCounts, useTitle } from '../hooks/index.js';
import { ANY, flat, GROUPS } from '../lib/categories.js';
import { buzz, prefsStore, setPref, useStore } from '../lib/store.js';
import { DealNote, DeckGlyph } from './Deal.jsx';
import RollingNumber from './RollingNumber.jsx';
import Segmented, { Choice } from './Segmented.jsx';
import Sheet from './Sheet.jsx';
import SiteFooter from './SiteFooter.jsx';

const AMOUNTS = [5, 10, 15, 20, 30, 50];
const EASE = [0.23, 1, 0.32, 1];
const nf = new Intl.NumberFormat('en');

const ABOUT = [
  'No account, scores stay in your browser.',
  'No repeats for six hours.',
  'Replay just the ones you missed.',
];

function About({ className = '' }) {
  return (
    <ul className={`space-y-2.5 text-[0.95rem] text-ink-2 ${className}`}>
      {ABOUT.map((text) => (
        <li key={text} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-lilac-soft text-brand-ink">
            <Check size={12} weight="bold" />
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

// A small stack of cards standing for the topic: its colour on top of the
// deck's indigo back.
function TopicMark({ topic, size = 'md' }) {
  const Icon = topic.icon;
  const box = size === 'lg' ? 'h-14 w-11' : 'h-13 w-10';
  return (
    <span className={`relative shrink-0 ${box}`} aria-hidden="true">
      <span className="card-back absolute inset-0 -translate-x-1 translate-y-0.5 -rotate-8 rounded-lg shadow-none" />
      <span
        className={`absolute inset-0 grid place-items-center rounded-lg border-2 border-on-flat/80 ${
          topic.id ? 'text-on-flat' : 'card-back text-white shadow-none'
        }`}
        style={topic.id ? { background: flat(topic.tone) } : undefined}
      >
        <Icon size={size === 'lg' ? 22 : 20} weight="bold" />
      </span>
    </span>
  );
}

// The fanned hand beside the setup on wider screens: the card on top is the
// one you're about to be dealt, so it changes with the topic and shuffles
// while dealing.
function Hand({ topic, amount, difficulty, busy }) {
  const Icon = topic.icon;
  const reduce = useReducedMotion();
  const rest = 'translate(0px, 0px) rotate(6deg)';
  return (
    <div
      className="group relative h-76 w-96 max-w-full shrink-0 select-none"
      aria-hidden="true"
    >
      <div className="card-back absolute top-10 left-4 h-60 w-44 -rotate-10 transition-transform duration-300 ease-out group-hover:-translate-x-3 group-hover:-rotate-12" />
      <div
        className="absolute top-5 left-22 h-60 w-44 -rotate-2 rounded-[22px] border-2 border-on-flat/15 shadow-[0_5px_0_rgb(31_35_64/0.15)] transition-transform duration-300 ease-out group-hover:-translate-x-1"
        style={{ background: flat(topic.id ? topic.tone : 'yellow') }}
      />
      <div
        className={`absolute top-2 left-42 h-60 w-44 ${busy ? 'dealing' : ''}`}
        style={{ '--dx': '14px', '--dr': '4deg' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={topic.id || 'any'}
            initial={{
              opacity: 0,
              transform: reduce ? rest : 'translate(40px, 18px) rotate(14deg)',
            }}
            animate={{ opacity: 1, transform: rest }}
            exit={{
              opacity: 0,
              transform: reduce ? rest : 'translate(-30px, 10px) rotate(-4deg)',
              transition: { duration: 0.2, ease: EASE },
            }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="card flex size-full flex-col overflow-hidden transition-[translate] duration-300 ease-out group-hover:translate-x-3"
          >
            <div
              className={`flex h-12 shrink-0 items-center justify-between gap-2 px-3.5 ${
                topic.id ? 'text-on-flat' : 'bg-back text-white'
              }`}
              style={topic.id ? { background: flat(topic.tone) } : undefined}
            >
              <span className="display truncate text-[1.05rem] font-bold">
                {topic.id ? topic.label : 'Anything goes'}
              </span>
              <Icon size={20} weight="bold" className="shrink-0" />
            </div>
            <div className="grid flex-1 place-items-center">
              <span className="display text-[5.5rem] leading-none font-extrabold text-brand">
                ?
              </span>
            </div>
            <div className="flex items-center justify-between border-t-2 border-line px-3.5 py-2.5 text-xs font-semibold text-muted">
              <span>{amount} cards</span>
              <span className="capitalize">{difficulty || 'Any level'}</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TopicTile({ topic, count, active, onSelect, wide }) {
  const Icon = topic.icon;
  return (
    <Choice
      name="topic"
      checked={active}
      onSelect={onSelect}
      className={`tact relative flex min-w-0 overflow-hidden text-left ${
        wide ? 'items-center gap-3 p-2.5 pr-3.5' : 'flex-col'
      } ${active ? 'border-brand [--edge-color:var(--color-brand)]' : ''}`}
    >
      {wide ? (
        <TopicMark topic={topic} />
      ) : (
        <span
          className="flex h-11 items-center justify-between px-3 text-on-flat"
          style={{ background: flat(topic.tone) }}
        >
          <Icon size={20} weight="bold" />
          <span className="text-xs font-semibold tabular-nums">
            {count != null ? nf.format(count) : ''}
          </span>
        </span>
      )}
      <span
        className={
          wide
            ? 'min-w-0 flex-1'
            : 'flex min-w-0 items-center justify-between gap-2 px-3 py-2.5'
        }
      >
        <span className="display block min-w-0 text-[1.02rem] leading-tight font-bold wrap-break-word">
          {topic.label}
        </span>
        {wide && (
          <span className="block text-sm text-muted">
            A bit of everything
            {count != null ? `, ${nf.format(count)} questions` : ''}
          </span>
        )}
        {!wide && active && (
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
            <Check size={11} weight="bold" />
          </span>
        )}
      </span>
      {wide && active && (
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-on-brand">
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
    setTimeout(onClose, 180);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Pick a topic" wide>
      <fieldset className="space-y-6 pb-1">
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
            <h3 className="caps mb-2.5">{group}</h3>
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 sm:grid-cols-3">
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

export default function Setup({
  categories,
  counts,
  status,
  deal,
  onStart,
  onCancel,
  onDismiss,
}) {
  useTitle('QuizzMe! · Quick trivia rounds');
  const prefs = useStore(prefsStore);
  const catCounts = useCategoryCounts(prefs.category);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [more, setMore] = useState(false);

  const current = prefs.category
    ? categories.find((c) => c.id === prefs.category)
    : null;
  const topic = current ?? ANY;
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
  const busy = deal.busy;

  const start = () => {
    if (busy) return;
    buzz.deal();
    onStart({ ...prefs, amount });
  };

  const surprise = () => {
    if (busy) return;
    buzz.deal();
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

  // Always rendered, empty until a topic is picked, so the chips keep their
  // height when the counts arrive.
  const hint = (d) => (
    <RollingNumber value={prefs.category ? (catCounts?.[d] ?? null) : null} />
  );

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
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-6 pt-2 pb-10 md:gap-y-8 lg:grid-cols-[minmax(0,1fr)_26rem] xl:gap-x-20">
        <section className="flex min-w-0 flex-col gap-6 md:flex-row md:items-center md:justify-between lg:flex-col lg:items-start">
          <div className="min-w-0">
            <h1 className="display text-[clamp(2.5rem,9vw,4.75rem)] leading-[0.98] font-extrabold tracking-[-0.035em]">
              Settle a bet.
              <br />
              <span className="relative inline-block text-brand">
                Or start one.
                <svg
                  viewBox="0 0 220 14"
                  preserveAspectRatio="none"
                  className="absolute inset-x-0 bottom-[-0.14em] h-[0.2em] w-full"
                  aria-hidden="true"
                >
                  <path
                    d="M3 9c40-6 110-8 214-3"
                    fill="none"
                    stroke="var(--color-lilac)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[1.02rem] text-ink-2 short:hidden sm:text-lg">
              Quick trivia on 24 topics, straight from Open Trivia DB.
            </p>
            <About className="mt-6 hidden lg:[@media(min-height:980px)]:block" />
          </div>
          <div className="hidden md:block lg:[@media(max-height:800px)]:hidden">
            <Hand
              topic={topic}
              amount={amount}
              difficulty={prefs.difficulty}
              busy={busy && deal.shown}
            />
          </div>
        </section>

        <section
          aria-labelledby="round-title"
          className="card mx-auto w-full max-w-xl p-4 sm:p-5 lg:max-w-none"
        >
          <h2 id="round-title" className="sr-only">
            Your round
          </h2>

          {status === 'offline' && (
            <p className="mb-4 flex items-start gap-2.5 rounded-2xl border-2 border-bad-line bg-bad-tint p-3 text-sm text-bad-ink">
              <Warning weight="bold" size={17} className="mt-px shrink-0" />
              Open Trivia DB isn't answering right now. It's usually back in a
              few minutes.
            </p>
          )}

          <button
            type="button"
            onClick={() => setTopicsOpen(true)}
            className="tact press group flex w-full items-center gap-3 bg-card-2 p-2.5 pr-3.5 text-left"
          >
            <TopicMark topic={topic} />
            <span className="min-w-0 flex-1">
              <span className="caps block">Topic</span>
              <span className="display block text-[1.2rem] leading-tight font-bold wrap-break-word">
                {topic.label}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-muted">
              <RollingNumber value={topicCount ?? null} />
            </span>
            <CaretRight
              size={17}
              weight="bold"
              className="shrink-0 text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5"
            />
          </button>

          <div className="mt-5 space-y-5">
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
              <legend className="caps mb-2 flex w-full justify-between">
                <span>Cards</span>
                {available != null && available < 50 && (
                  <span className="inline-flex gap-1 font-medium">
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
                    className="tact chip grid h-11 place-items-center text-[1.05rem] tabular-nums"
                  >
                    {n}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <div className="rounded-2xl border-2 border-dashed border-edge">
              <button
                type="button"
                onClick={() => setMore((m) => !m)}
                aria-expanded={more}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.95rem] font-semibold">
                    More options
                  </span>
                  <span className="slot text-[0.8125rem] text-muted">
                    <AnimatePresence initial={false}>
                      {!more && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.1 } }}
                          transition={{ duration: 0.2 }}
                          className="block"
                        >
                          {moreSummary}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="invisible block" aria-hidden="true">
                      {moreSummary}
                    </span>
                  </span>
                </span>
                <CaretDown
                  size={17}
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
                    transition={{ duration: 0.26, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 px-3.5 pt-1 pb-4">
                      <Segmented
                        label="Question type"
                        value={prefs.type}
                        onChange={(v) => setPref('type', v)}
                        options={[
                          { value: '', label: 'Mixed' },
                          { value: 'multiple', label: 'Choice' },
                          { value: 'boolean', label: 'True/false' },
                        ]}
                      />
                      <div className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 min-[360px]:gap-3">
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

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={start}
              disabled={noQuestions}
              aria-busy={busy}
              data-sfx="deal"
              className="btn btn-brand press min-w-0 flex-1"
            >
              <DeckGlyph busy={busy} />
              <span className="slot text-left">
                <span className={busy ? 'invisible' : ''}>
                  Deal {amount} cards
                </span>
                <span className={busy ? '' : 'invisible'}>Dealing…</span>
              </span>
            </button>
            <button
              type="button"
              onClick={surprise}
              data-sfx="deal"
              className="btn btn-plain tact press shrink-0 px-4 text-brand"
              aria-label="Surprise me: a random topic, ten cards"
              data-tip="Random topic, ten cards"
            >
              <DiceFive size={21} weight="bold" />
              <span className="hidden text-ink min-[420px]:inline">
                Surprise me
              </span>
            </button>
          </div>
          <DealNote deal={deal} onCancel={onCancel} onDismiss={onDismiss} />
        </section>
      </div>

      <SiteFooter />

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
