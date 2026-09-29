export default function SiteFooter() {
  return (
    <footer className="bottom-bar flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-dashed border-line-2 pt-4 text-xs text-muted">
      <span>
        Questions from{' '}
        <a
          className="font-medium text-ink-2 underline decoration-line-2 underline-offset-4 transition-colors duration-150 hover-fine:decoration-ink"
          href="https://opentdb.com"
        >
          Open Trivia DB
        </a>
        , CC BY-SA 4.0
      </span>
      <span>
        Made by{' '}
        <a
          className="font-medium text-ink-2 underline decoration-line-2 underline-offset-4 transition-colors duration-150 hover-fine:decoration-ink"
          href="https://ashwin.co.in"
        >
          Ashwin
        </a>
      </span>
    </footer>
  );
}
