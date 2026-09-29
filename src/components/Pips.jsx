const LEVEL = { easy: 1, medium: 2, hard: 3 };

// Difficulty printed as pips, like the level marks on a game card.
export function Pips({ level, className = '' }) {
  const n = LEVEL[level] ?? 0;
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      role="img"
      aria-label={`${level} difficulty`}
    >
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${i <= n ? 'bg-current' : 'bg-current opacity-25'}`}
        />
      ))}
    </span>
  );
}
