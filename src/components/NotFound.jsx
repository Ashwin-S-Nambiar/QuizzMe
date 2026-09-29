import { ArrowRight, Check, X } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTitle } from '../hooks/index.js';
import { sfx } from '../lib/sound.js';
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
  useTitle('Page not found · QuizzMe!');
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
      setTimeout(() => location.assign('/'), 650);
    } else {
      sfx.wrong();
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem-var(--safe-t))] max-w-6xl flex-col px-(--gutter)">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center pt-3 pb-16">
        <section className="card overflow-hidden">
          <div className="flex h-12 items-center justify-between gap-3 bg-pink px-4 text-on-flat sm:px-6">
            <span className="printed text-[1.3rem] uppercase">Error 404</span>
            <Pips level="hard" />
          </div>
          <div className="p-4 pt-5 sm:p-6 sm:pt-7">
            <h1 className="text-[clamp(1.6rem,5vw,2.3rem)] leading-[1.1] font-semibold tracking-[-0.015em]">
              Where did this page go?
            </h1>
            <p className="mt-2 text-muted">
              <span className="font-medium text-ink-2">
                {location.pathname}
              </span>{' '}
              isn't a page here.
            </p>

            <div className="mt-6 grid gap-2 sm:mt-8">
              {OPTIONS.map((o, i) => {
                const done = picked.includes(i);
                const tone = done
                  ? o.right
                    ? 'bg-good-tint text-good-ink shadow-[inset_0_0_0_1.5px_var(--color-good)]'
                    : 'bg-bad-tint text-bad-ink opacity-70 shadow-[inset_0_0_0_1.5px_var(--color-bad)]'
                  : 'shadow-[inset_0_0_0_1px_var(--color-line-2)] hover-fine:bg-bg-2/70 hover-fine:shadow-[inset_0_0_0_1px_var(--color-ink)]';
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
                    className={`press flex min-h-14 items-center gap-3 rounded-[10px] p-2 pr-3.5 text-left ${tone}`}
                  >
                    <span
                      className={`printed grid size-9 shrink-0 place-items-center rounded-[7px] text-lg ${
                        done
                          ? o.right
                            ? 'bg-good text-card'
                            : 'bg-bad text-card'
                          : 'bg-bg-2 text-ink-2'
                      }`}
                    >
                      {done ? (
                        o.right ? (
                          <Check size={17} weight="bold" />
                        ) : (
                          <X size={17} weight="bold" />
                        )
                      ) : (
                        'ABCD'[i]
                      )}
                    </span>
                    <span className="flex-1 font-medium">{o.label}</span>
                    {o.right && !done && (
                      <ArrowRight
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
