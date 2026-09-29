import { ArrowClockwise, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

const EASE = [0.23, 1, 0.32, 1];

// Three card edges that shuffle while a deal is in flight. Sized to sit in
// place of a button icon, so the button never changes width.
export function DeckGlyph({ busy, size = 18 }) {
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`absolute inset-y-[12%] left-[18%] w-[64%] rounded-[3px] border-[1.5px] border-current ${
            busy && i === 2 ? 'dealing' : ''
          }`}
          style={{
            transform: `translateX(${(i - 1) * 3}px) rotate(${(i - 1) * 8}deg)`,
            background: i === 2 ? 'currentColor' : 'transparent',
            opacity: i === 2 ? 1 : 0.55,
            '--dx': '5px',
            '--dr': '14deg',
          }}
        />
      ))}
    </span>
  );
}

function useCountdown(until) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!until) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [until]);
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
}

// The line under a deal button: what's happening while it's slow, or what
// went wrong and how to try again. It opens and closes in place instead of
// popping up somewhere else on the page.
export function DealNote({ deal, onCancel, onDismiss, className = '' }) {
  const left = useCountdown(deal.busy ? deal.waitUntil : 0);
  const key = deal.error ? 'error' : deal.busy && deal.shown ? 'busy' : null;

  return (
    <AnimatePresence initial={false}>
      {key && (
        <motion.div
          key="note"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: EASE }}
          className={`overflow-hidden ${className}`}
        >
          <div className="slot pt-3">
            <AnimatePresence initial={false}>
              <motion.div
                key={key}
                initial={{ opacity: 0, transform: 'translateY(4px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)' }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                {key === 'busy' ? (
                  <p
                    className="flex items-center justify-between gap-3 text-sm text-muted"
                    role="status"
                  >
                    <span>
                      {left > 0
                        ? `Open Trivia DB takes one request every 5 seconds. Dealing in ${left}s.`
                        : 'Shuffling the deck…'}
                    </span>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="press shrink-0 rounded-md px-1 font-semibold text-brand-ink underline decoration-lilac decoration-2 underline-offset-4 hover-fine:decoration-brand"
                    >
                      Cancel
                    </button>
                  </p>
                ) : (
                  <div
                    className="flex items-center gap-2 rounded-2xl border-2 border-bad-line bg-bad-tint py-2 pr-2 pl-3.5 text-sm text-bad-ink"
                    role="alert"
                  >
                    <p className="min-w-0 flex-1 py-1">{deal.error.message}</p>
                    {deal.error.action && (
                      <button
                        type="button"
                        onClick={deal.error.action.run}
                        className="btn btn-bad press h-9 shrink-0 gap-1.5 rounded-xl px-3 text-sm [--edge:3px]"
                      >
                        <ArrowClockwise weight="bold" size={14} />
                        {deal.error.action.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onDismiss}
                      className="press grid size-9 shrink-0 place-items-center rounded-xl hover-fine:bg-bad/10"
                      aria-label="Dismiss"
                    >
                      <X weight="bold" size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
