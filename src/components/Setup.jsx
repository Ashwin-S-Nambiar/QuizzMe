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
import { haptic, prefsStore, setPref, useStore } from '../lib/store.js';
import { DealNote, DeckGlyph } from './Deal.jsx';
import RollingNumber from './RollingNumber.jsx';
import Segmented, { Choice } from './Segmented.jsx';
import Sheet from './Sheet.jsx';
import SiteFooter from './SiteFooter.jsx';

const AMOUNTS = [5, 10, 15, 20, 30, 50];
const EASE = [0.23, 1, 0.32, 1];
const nf = new Intl.NumberFormat('en');

const ABOUT = [
  'No account. Scores live in your browser.',
  'Seen a question? It sits out for the next six hours.',
  'Get some wrong and you can replay just those.',
];

function About({ className }) {
  return (
    <ol className={`space-y-2 text-[0.95rem] text-ink-2 ${className}`}>
      {ABOUT.map((text, i) => (
        <li key={text} className="flex items-baseline gap-3">
          <span className="printed w-5 shrink-0 text-[0.95rem] text-muted">
            0{i + 1}
          </span>
          <span>{text}</span>
        </li>
      ))}
    </ol>
  );
}

// The fanned hand beside the setup: the card on top is the one you're about
// to be dealt, so it changes with the topic, and shuffles while dealing.
function Hand({ topic, amount, difficulty, busy }) {
  const Icon = topic.icon;
  const reduce = useReducedMotion();
  const rest = 'translate(0px, 0px) rotate(7deg)';
  return (
    <div
      className="group relative h-72 w-100 max-w-full select-none"
      aria-hidden="true"
    >
      <div className="card-back absolute top-8 left-2 h-60 w-44 rotate-[-10deg] transition-transform duration-300 ease-out group-hover:-translate-x-3 group-hover:rotate-[-13deg]" />
      <div
        className="card absolute top-4 left-20 h-60 w-44 -rotate-2 overflow-hidden transition-transform duration-300 ease-out group-hover:-translate-x-1"
        style={{ background: flat(topic.tone) }}
      >
        <div className="absolute inset-3 rounded-lg border-[1.5px] border-dashed border-on-flat/25" />
      </div>
      <div
        className={`absolute top-2 left-40 h-60 w-44 ${busy ? 'dealing' : ''}`}
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
              className={`flex h-14 shrink-0 items-center justify-between gap-2 px-3 ${
                topic.id
                  ? 'text-on-flat'
                  : 'card-back rounded-none text-card shadow-none'
              }`}
              style={topic.id ? { background: flat(topic.tone) } : undefined}
            >
              <span className="printed truncate text-xl uppercase">
                {topic.id ? topic.label : 'Anything'}
              </span>
              <Icon size={22} weight="bold" className="shrink-0" />
            </div>
            <div className="grid flex-1 place-items-center">
              <span
                className="printed text-[7rem] leading-none"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: `2px ${topic.id ? flat(topic.tone) : 'var(--color-ink)'}`,
                }}
              >
                ?
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-line-2 px-3 py-2 text-[0.7rem] font-semibold tracking-[0.06em] text-muted uppercase semi-cond">
              <span>{amount} cards</span>
              <span>{difficulty || 'Any level'}</span>
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
      className={`relative flex overflow-hidden rounded-[10px] bg-card text-left ${
        wide ? 'items-center' : 'flex-col'
      } ${
        active
          ? 'shadow-[0_0_0_2px_var(--color-ink)]'
          : 'shadow-[0_0_0_1px_var(--color-line-2)] hover-fine:-translate-y-0.5 hover-fine:shadow-(--shadow-card)'
      }`}
    >
      <span
        className={`flex items-center ${
          wide
            ? 'card-back size-14 shrink-0 justify-center rounded-none text-card shadow-none'
            : 'h-11 justify-between px-2.5 text-on-flat'
        }`}
        style={wide ? undefined : { background: flat(topic.tone) }}
      >
        <Icon size={wide ? 24 : 21} weight="bold" />
        {!wide && (
          <span className="text-[0.7rem] font-semibold tabular-nums">
            {active ? (
              <span className="grid size-5 place-items-center rounded-full bg-ink text-card">
                <Check size={11} weight="bold" />
              </span>
            ) : count != null ? (
              nf.format(count)
            ) : (
              ''
            )}
          </span>
        )}
      </span>
      <span
        className={
          wide ? 'min-w-0 flex-1 px-3.5' : 'min-w-0 px-2.5 pt-2 pb-2.5'
        }
      >
        <span className="printed block truncate text-[1.2rem] uppercase">
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
        <span className="mr-3.5 grid size-6 place-items-center rounded-full bg-ink text-card">
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
            <h3 className="caps mb-2.5">{group}</h3>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
  const busy = deal.busy;

  const start = () => {
    if (busy) return;
    haptic(12);
    onStart({ ...prefs, amount });
  };

  const surprise = () => {
    if (busy) return;
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
      <div className="grid flex-1 grid-cols-[minmax(0,1fr)] items-center gap-x-16 gap-y-6 pt-2 pb-8 short:gap-y-4 lg:grid-cols-[minmax(0,1fr)_25rem]">
        <section className="min-w-0">
          <h1 className="printed mt-3 text-[clamp(3rem,10.5vw,6.2rem)] uppercase short:mt-0 short:text-[clamp(2.4rem,9vw,3.6rem)]">
            Settle a bet.
            <br />
            <span className="relative isolate inline-block">
              <span
                className="absolute -inset-x-1.5 top-[18%] bottom-[4%] -z-10 -rotate-1 rounded-[3px] bg-yellow"
                aria-hidden="true"
              />
              <span className="text-on-flat">Or start one.</span>
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-[1.02rem] text-ink-2 short:hidden sm:mt-5 sm:text-lg">
            Quick trivia rounds on 24 topics. The questions come straight from
            Open Trivia DB, so I don't know what's next either.
          </p>
          <div className="mt-10 hidden items-end gap-10 lg:flex [@media(max-height:820px)]:hidden">
            <Hand
              topic={topic}
              amount={amount}
              difficulty={prefs.difficulty}
              busy={busy && deal.shown}
            />
          </div>
          <About className="mt-8 hidden lg:block" />
        </section>

        <section aria-labelledby="round-title" className="card p-4 sm:p-5">
          <h2 id="round-title" className="sr-only">
            Your round
          </h2>

          {status === 'offline' && (
            <p className="mb-4 flex items-start gap-2.5 rounded-[10px] bg-bad-tint p-3 text-sm text-bad-ink">
              <Warning weight="bold" size={17} className="mt-px shrink-0" />
              Open Trivia DB isn't answering right now. It's usually back in a
              few minutes.
            </p>
          )}

          <button
            type="button"
            onClick={() => setTopicsOpen(true)}
            className="group press flex w-full items-center gap-3 rounded-[11px] bg-bg-2 p-2 pr-3 text-left hover-fine:bg-bg"
          >
            <span
              className={`grid h-13 w-10 shrink-0 place-items-center rounded-md shadow-(--shadow-card) transition-transform duration-200 ease-out group-hover:-rotate-6 ${
                topic.id ? 'text-on-flat' : 'card-back text-card'
              }`}
              style={topic.id ? { background: flat(topic.tone) } : undefined}
            >
              <TopicIcon size={20} weight="bold" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="caps block">Topic</span>
              <span className="printed block truncate text-[1.45rem] uppercase">
                {topic.label}
              </span>
            </span>
            <span className="text-xs font-medium text-muted">
              <RollingNumber value={topicCount ?? null} />
            </span>
            <CaretRight
              size={16}
              weight="bold"
              className="shrink-0 text-muted transition-transform duration-200 ease-out group-hover:translate-x-0.5"
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
              <legend className="caps mb-2 flex w-full justify-between">
                <span>Cards</span>
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
                    className={`printed grid h-11 place-items-center rounded-lg text-[1.3rem] ${
                      n === amount
                        ? 'bg-ink text-card'
                        : 'bg-bg-2 text-ink-2 hover-fine:bg-bg hover-fine:text-ink'
                    }`}
                  >
                    {n}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <div className="rounded-[11px] shadow-[inset_0_0_0_1px_var(--color-line-2)]">
              <button
                type="button"
                onClick={() => setMore((m) => !m)}
                aria-expanded={more}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    More options
                  </span>
                  <span className="slot text-xs text-muted">
                    <AnimatePresence initial={false}>
                      {!more && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.1 } }}
                          transition={{ duration: 0.2 }}
                          className="block truncate"
                        >
                          {moreSummary}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <span className="invisible block">&nbsp;</span>
                  </span>
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
                    transition={{ duration: 0.26, ease: EASE }}
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
              aria-busy={busy}
              className="btn btn-brand press flex-1"
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
              className="btn btn-plain press px-4"
              aria-label="Surprise me: a random topic, ten cards"
              data-tip="Random topic, ten cards"
            >
              <DiceFive size={20} weight="bold" />
              <span className="hidden min-[400px]:inline">Surprise me</span>
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
