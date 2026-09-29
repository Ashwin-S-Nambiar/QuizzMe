export default function SiteFooter() {
  return (
    <footer className="bottom-bar flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t-2 border-line pt-4 text-xs text-muted short:pt-3">
      <span>
        Questions from{' '}
        <a
          className="font-semibold text-ink-2 underline decoration-lilac decoration-2 underline-offset-4 transition-colors duration-150 hover-fine:decoration-brand"
          href="https://opentdb.com"
        >
          Open Trivia DB
        </a>
        , CC BY-SA 4.0
      </span>
      <span>
        Made by{' '}
        <a
          className="font-semibold text-ink-2 underline decoration-lilac decoration-2 underline-offset-4 transition-colors duration-150 hover-fine:decoration-brand"
          href="https://ashwin.co.in"
        >
          Ashwin
        </a>
      </span>
    </footer>
  );
}
