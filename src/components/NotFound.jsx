import { ArrowRight, Check, X } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTitle } from '../hooks/index.js';
import { sfx } from '../lib/sound.js';

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
    <main className="mx-auto flex min-h-[calc(100dvh-4rem-var(--safe-t))] max-w-2xl flex-col justify-center px-(--gutter) pb-16">
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
        <span className="rounded-full bg-surface px-2.5 py-1 text-ink-2">
          Error 404
        </span>
        <span className="rounded-full bg-bad-tint px-2.5 py-1 text-bad-ink">
          Hard
        </span>
      </div>
      <h1 className="mt-4 font-display text-[clamp(2rem,6vw,3.2rem)] leading-[1.02] font-semibold tracking-[-0.03em]">
        Where did this page go?
      </h1>
      <p className="mt-3 text-muted">
        <span className="font-mono text-sm">{location.pathname}</span> isn't a
        page here.
      </p>

      <div className="mt-8 grid gap-2.5">
        {OPTIONS.map((o, i) => {
          const done = picked.includes(i);
          const tone = done
            ? o.right
              ? 'bg-good-tint text-good-ink shadow-[inset_0_0_0_1.5px_var(--color-good)]'
              : 'bg-bad-tint text-bad-ink opacity-70 shadow-[inset_0_0_0_1.5px_var(--color-bad)]'
            : 'bg-raised shadow-[inset_0_0_0_1px_var(--color-line)] hover-fine:bg-surface';
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
                        'translateX(-7px)',
                        'translateX(6px)',
                        'translateX(-3px)',
                        'translateX(0px)',
                      ],
                    }
                  : undefined
              }
              transition={{ duration: 0.34, ease: 'easeOut' }}
              className={`press flex min-h-15 items-center gap-3.5 rounded-2xl p-2.5 pr-4 text-left ${tone}`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl font-mono text-sm ${
                  done
                    ? o.right
                      ? 'bg-good text-raised'
                      : 'bg-bad text-raised'
                    : 'bg-surface text-muted'
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
                <ArrowRight size={17} weight="bold" className="text-muted" />
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="mt-5 min-h-6 text-sm text-muted" aria-live="polite">
        {last?.note}
      </p>
    </main>
  );
}
