import { useEffect, useMemo, useState } from 'react';
import { historyStore, useStore } from '../lib/store.js';
import Sheet from './Sheet.jsx';

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function ago(at) {
  const s = (at - Date.now()) / 1000;
  const steps = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.35, 'week'],
    [12, 'month'],
  ];
  let v = s;
  for (const [size, unit] of steps) {
    if (Math.abs(v) < size) return rtf.format(Math.round(v), unit);
    v /= size;
  }
  return rtf.format(Math.round(v), 'year');
}

export default function StatsSheet({ open, onClose }) {
  const runs = useStore(historyStore);
  const [arming, setArming] = useState(false);

  useEffect(() => {
    if (!arming) return;
    const id = setTimeout(() => setArming(false), 2500);
    return () => clearTimeout(id);
  }, [arming]);

  const stats = useMemo(() => {
    let right = 0;
    let total = 0;
    let bestStreak = 0;
    const topics = {};
    for (const r of runs) {
      right += r.score;
      total += r.total;
      bestStreak = Math.max(bestStreak, r.bestStreak);
      topics[r.topic] ??= { right: 0, total: 0, runs: 0 };
      const t = topics[r.topic];
      t.right += r.score;
      t.total += r.total;
      t.runs++;
    }
    const byTopic = Object.entries(topics)
      .sort((a, b) => b[1].runs - a[1].runs)
      .slice(0, 6);
    return { right, total, bestStreak, byTopic };
  }, [runs]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your stats"
      footer={
        runs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (!arming) return setArming(true);
              historyStore.set([]);
              setArming(false);
            }}
            className={`btn press w-full ${arming ? 'bg-bad text-raised' : 'glass text-bad-ink'}`}
          >
            {arming ? 'Tap again to clear everything' : 'Clear history'}
          </button>
        )
      }
    >
      {runs.length === 0 ? (
        <p className="py-6 text-center text-muted">
          Nothing yet. Finish a round and it'll show up here.
        </p>
      ) : (
        <div className="space-y-6">
          <dl className="grid grid-cols-3 gap-2">
            {[
              ['Rounds', runs.length],
              [
                'Accuracy',
                `${Math.round((stats.right / Math.max(1, stats.total)) * 100)}%`,
              ],
              ['Best streak', stats.bestStreak],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface p-3">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-1 font-mono text-xl font-medium tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="eyebrow mb-3">By topic</h3>
            <ul className="space-y-2.5">
              {stats.byTopic.map(([topic, t]) => (
                <li key={topic} className="text-sm">
                  <div className="mb-1 flex justify-between gap-3">
                    <span className="truncate">{topic}</span>
                    <span className="shrink-0 font-mono text-xs text-muted tabular-nums">
                      {Math.round((t.right / t.total) * 100)}% · {t.runs}
                    </span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full origin-left rounded-full bg-accent"
                      style={{ transform: `scaleX(${t.right / t.total})` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="eyebrow mb-2">Recent</h3>
            <ul className="divide-y divide-line">
              {runs.slice(0, 12).map((r) => (
                <li
                  key={r.at}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{r.topic}</span>
                    <span className="block text-xs text-muted first-letter:uppercase">
                      {[
                        r.difficulty || 'any difficulty',
                        r.practice ? 'practice' : null,
                        ago(r.at),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {r.score}/{r.total}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </Sheet>
  );
}
