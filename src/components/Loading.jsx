import { useEffect, useState } from 'react';
import { useTitle } from '../hooks/index.js';

export default function Loading({ waitUntil, onCancel }) {
  useTitle('Shuffling questions · QuizzMe!');
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!waitUntil) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [waitUntil]);

  const left = waitUntil ? Math.max(0, Math.ceil((waitUntil - now) / 1000)) : 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col px-(--gutter) pt-6 pb-10">
      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="skeleton h-2 flex-1 rounded-full" />
        <div className="skeleton size-10 rounded-full" />
      </div>
      <div className="mt-10 space-y-3" aria-hidden="true">
        <div className="skeleton h-4 w-28 rounded-full" />
        <div className="skeleton h-9 w-full rounded-xl" />
        <div className="skeleton h-9 w-2/3 rounded-xl" />
      </div>
      <div className="mt-10 grid gap-2.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton h-15 rounded-2xl"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-0 z-10 grid place-items-center px-(--gutter)">
        <div
          className="glass pointer-events-auto flex max-w-sm backdrop-blur-xl flex-col items-center gap-3 rounded-3xl p-5 text-center"
          role="status"
        >
          <p className="text-sm text-balance text-ink-2">
            {left > 0
              ? `Open Trivia DB takes one request every 5 seconds. Yours goes in ${left}s.`
              : 'Shuffling questions…'}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="btn press glass h-10 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
