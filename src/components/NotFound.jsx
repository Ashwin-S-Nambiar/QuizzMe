import { ArrowRightIcon, CheckIcon, XIcon } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTitle } from '../hooks/index.js';
import { sfx } from '../lib/sound.js';
import { buzz } from '../lib/store.js';
import { Pips } from './Pips.jsx';
import SiteFooter from './SiteFooter.jsx';

const OPTIONS = [
  {
    label: 'It never existed',
    right: false,
    note: 'Possible. Not the answer though.',
  },
  {
    label: 'Someone typed the link wrong',
    right: false,
    note: 'Probably true. Still not it.',
  },
  {
    label: "It's hiding behind a question",
    right: false,
    note: "Checked. It isn't.",
  },
  { label: 'Take me back to the quiz', right: true, note: 'Correct.' },
];

export default function NotFound() {
  useTitle('Not found · QuizzMe!');
  const [picked, setPicked] = useState([]);
  const reduce = useReducedMotion();
  const last = OPTIONS[picked.at(-1)];

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.append(meta);
    return () => meta.remove();
  }, []);

  const choose = (i) => {
    if (picked.includes(i)) return;
    setPicked((p) => [...p, i]);
    if (OPTIONS[i].right) {
      sfx.right(3);
      buzz.right();
      setTimeout(() => location.assign('/'), 650);
    } else {
      sfx.wrong();
      buzz.wrong();
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem-var(--safe-t))] max-w-6xl flex-col px-(--gutter)">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pt-2 pb-10">
        <section className="card overflow-hidden">
          <div className="flex min-h-12 items-center justify-between gap-3 bg-pink px-4 text-on-flat sm:px-6">
            <span className="display text-[1.05rem] font-bold">Error 404</span>
            <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
              <Pips level="hard" />
              Hard
            </span>
          </div>
          <div className="p-4 pt-5 sm:p-6 sm:pt-7">
            <h1 className="display text-[clamp(1.45rem,4.6vw,2.1rem)] leading-[1.2] font-bold">
              Where did this page go?
            </h1>
            <p className="mt-2 text-muted">
              <span className="font-semibold break-all text-ink-2">
                {location.pathname}
              </span>{' '}
              isn't a page here.
            </p>

            <div className="mt-5 grid gap-x-2.5 gap-y-3 sm:mt-7 md:grid-cols-2">
              {OPTIONS.map((o, i) => {
                const done = picked.includes(i);
                const tone = done
                  ? o.right
                    ? 'border-good bg-good-tint text-good-ink [--edge-color:var(--color-good-edge)]'
                    : 'border-bad bg-bad-tint text-bad-ink [--edge-color:var(--color-bad-edge)]'
                  : '';
                return (
                  <motion.button
                    key={o.label}
                    type="button"
                    data-sfx="none"
                    onClick={() => choose(i)}
                    animate={
                      done && !o.right && !reduce
                        ? {
                            transform: [
                              'translateX(0px)',
                              'translateX(-6px)',
                              'translateX(5px)',
                              'translateX(-3px)',
                              'translateX(0px)',
                            ],
                          }
                        : undefined
                    }
                    transition={{ duration: 0.34, ease: 'easeOut' }}
                    className={`tact press flex min-h-14 min-w-0 items-center gap-3 py-2 pr-4 pl-2 text-left ${tone}`}
                  >
                    <span
                      className={`display grid size-9 shrink-0 place-items-center rounded-[10px] border-2 text-[0.95rem] font-bold ${
                        done
                          ? o.right
                            ? 'border-good bg-good text-white'
                            : 'border-bad bg-bad text-white'
                          : 'border-line text-muted'
                      }`}
                    >
                      {done ? (
                        o.right ? (
                          <CheckIcon size={17} weight="bold" />
                        ) : (
                          <XIcon size={17} weight="bold" />
                        )
                      ) : (
                        'ABCD'[i]
                      )}
                    </span>
                    <span className="min-w-0 flex-1 text-[1.02rem] leading-snug font-medium">
                      {o.label}
                    </span>
                    {o.right && !done && (
                      <ArrowRightIcon
                        size={17}
                        weight="bold"
                        className="text-muted"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <p className="mt-5 min-h-6 text-sm text-muted" aria-live="polite">
              {last?.note}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
