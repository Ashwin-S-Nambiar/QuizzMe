export default function SiteFooter() {
  return (
    <footer className="bottom-bar flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line pt-4 text-xs text-muted">
      <span>
        Questions from{' '}
        <a
          className="text-ink-2 underline decoration-line-2 underline-offset-4 hover-fine:decoration-ink-2"
          href="https://opentdb.com"
        >
          Open Trivia DB
        </a>
        , CC BY-SA 4.0
      </span>
      <span>
        Made by{' '}
        <a
          className="text-ink-2 underline decoration-line-2 underline-offset-4 hover-fine:decoration-ink-2"
          href="https://ashwin.co.in"
        >
          Ashwin
        </a>
      </span>
    </footer>
  );
}
